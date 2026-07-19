import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const backendRoot = fileURLToPath(new URL("../..", import.meta.url));
const statsFixture = fileURLToPath(
  new URL("../fixtures/import/valid-stats-edge-cases.xml", import.meta.url),
);

let child: ReturnType<typeof spawn> | undefined;
let tempDir: string | undefined;

afterEach(async () => {
  if (child && !child.killed) {
    child.kill("SIGTERM");
  }
  child = undefined;
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
  tempDir = undefined;
});

async function startBackend(): Promise<{ port: number }> {
  tempDir = await mkdtemp(join(backendRoot, ".tmp-stats-edge-"));
  const databasePath = join(tempDir, "markr.sqlite");

  await new Promise<void>((resolve, reject) => {
    const migrate = spawn("bun", ["run", "src/db/migrate.ts"], {
      cwd: backendRoot,
      env: { ...process.env, DATABASE_PATH: databasePath },
    });
    migrate.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`migrate failed: ${code}`));
      }
    });
  });

  child = spawn("bun", ["src/server.ts"], {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_PATH: databasePath, PORT: "0" },
  });

  const port = await new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("backend startup timeout")), 15_000);
    child?.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      const match = text.match(/Markr backend ready.*port: (?<port>\d+)/s);
      if (match?.groups?.port) {
        clearTimeout(timeout);
        resolve(Number(match.groups.port));
      }
    });
    child?.stderr?.on("data", (chunk: Buffer) => {
      console.error(chunk.toString("utf8"));
    });
    child?.on("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`backend exited early: ${code}`));
    });
  });

  return { port };
}

function assertFiniteStats(payload: Record<string, unknown>) {
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === "number") {
      expect(Number.isFinite(value), `${key} must be finite`).toBe(true);
      expect(Number.isNaN(value), `${key} must not be NaN`).toBe(false);
    }
  }
}

describe("stats edge fixtures", () => {
  it("returns 404 for empty unknown tests before import", async () => {
    const { port } = await startBackend();
    const aggregate = await fetch(`http://127.0.0.1:${port}/results/missing/aggregate`);
    const histogram = await fetch(`http://127.0.0.1:${port}/results/missing/histogram`);
    expect(aggregate.status).toBe(404);
    expect(histogram.status).toBe(404);
  });

  it("imports stats-edge fixture and serves aggregate/histogram edges", async () => {
    const { port } = await startBackend();
    const xml = await readFile(statsFixture);

    const importResponse = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "Content-Type": "text/xml+markr" },
      body: xml,
    });
    expect(importResponse.status).toBe(200);
    await expect(importResponse.json()).resolves.toEqual({
      imported: 11,
      test_ids: ["edges", "equal", "single", "type7"],
    });

    const singleAgg = (await (
      await fetch(`http://127.0.0.1:${port}/results/single/aggregate`)
    ).json()) as Record<string, number>;
    expect(singleAgg).toMatchObject({
      count: 1,
      mean: 50,
      stddev: 0,
      min: 50,
      max: 50,
      p25: 50,
      p50: 50,
      p75: 50,
    });
    assertFiniteStats(singleAgg);

    const equalAgg = (await (
      await fetch(`http://127.0.0.1:${port}/results/equal/aggregate`)
    ).json()) as Record<string, number>;
    expect(equalAgg.count).toBe(3);
    expect(equalAgg.mean).toBe(100);
    expect(equalAgg.stddev).toBe(0);
    expect(equalAgg.min).toBe(100);
    expect(equalAgg.max).toBe(100);
    assertFiniteStats(equalAgg);

    const equalHist = (await (
      await fetch(`http://127.0.0.1:${port}/results/equal/histogram`)
    ).json()) as { total: number; bins: { lower_pct: number; upper_pct: number; count: number }[] };
    expect(equalHist.total).toBe(3);
    expect(equalHist.bins.map((bin) => bin.count)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 3]);
    expect(equalHist.bins[9]).toMatchObject({ lower_pct: 90, upper_pct: 100, count: 3 });

    const edgesHist = (await (
      await fetch(`http://127.0.0.1:${port}/results/edges/histogram`)
    ).json()) as { total: number; bins: { count: number }[] };
    expect(edgesHist.total).toBe(3);
    // 0% → bin 0; 10% → bin 1; 100% → bin 9
    expect(edgesHist.bins.map((bin) => bin.count)).toEqual([1, 1, 0, 0, 0, 0, 0, 0, 0, 1]);

    const type7Agg = (await (
      await fetch(`http://127.0.0.1:${port}/results/type7/aggregate`)
    ).json()) as Record<string, number>;
    expect(type7Agg.count).toBe(4);
    expect(type7Agg.min).toBe(10);
    expect(type7Agg.max).toBe(40);
    expect(type7Agg.p25).toBe(17.5);
    expect(type7Agg.p50).toBe(25);
    expect(type7Agg.p75).toBe(32.5);
    assertFiniteStats(type7Agg);
  });
});
