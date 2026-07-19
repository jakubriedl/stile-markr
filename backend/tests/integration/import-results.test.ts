import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const backendRoot = fileURLToPath(new URL("../..", import.meta.url));
const samplePath = fileURLToPath(new URL("../../../task/sample_results.xml", import.meta.url));

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

async function startBackend(): Promise<{ port: number; databasePath: string }> {
  tempDir = await mkdtemp(join(backendRoot, ".tmp-import-"));
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

  return { port, databasePath };
}

describe("import to results integration", () => {
  it("imports the sample fixture and serves list/aggregate/histogram oracles", async () => {
    const { port } = await startBackend();
    const xml = await readFile(samplePath);

    const importResponse = await fetch(`http://127.0.0.1:${port}/import`, {
      method: "POST",
      headers: { "Content-Type": "text/xml+markr" },
      body: xml,
    });
    expect(importResponse.status).toBe(200);
    await expect(importResponse.json()).resolves.toEqual({
      imported: 81,
      test_ids: ["9863"],
    });

    const testsResponse = await fetch(`http://127.0.0.1:${port}/tests`);
    expect(testsResponse.status).toBe(200);
    await expect(testsResponse.json()).resolves.toEqual({
      tests: [{ test_id: "9863", student_count: 81, marks_available: 20 }],
    });

    const aggregateResponse = await fetch(`http://127.0.0.1:${port}/results/9863/aggregate`);
    expect(aggregateResponse.status).toBe(200);
    const aggregate = (await aggregateResponse.json()) as {
      count: number;
      mean: number;
      stddev: number;
      min: number;
      max: number;
      p25: number;
      p50: number;
      p75: number;
    };
    expect(aggregate.count).toBe(81);
    expect(aggregate.min).toBe(30);
    expect(aggregate.max).toBe(75);
    expect(aggregate.p25).toBe(45);
    expect(aggregate.p50).toBe(50);
    expect(aggregate.p75).toBeCloseTo(55, 10);
    expect(aggregate.mean).toBeCloseTo(50.80246913580247, 8);
    expect(aggregate.stddev).toBeCloseTo(9.92119535943923, 8);

    const histogramResponse = await fetch(`http://127.0.0.1:${port}/results/9863/histogram`);
    expect(histogramResponse.status).toBe(200);
    const histogram = (await histogramResponse.json()) as {
      total: number;
      bins: { count: number }[];
    };
    expect(histogram.total).toBe(81);
    expect(histogram.bins.map((bin) => bin.count)).toEqual([0, 0, 0, 6, 28, 28, 14, 5, 0, 0]);
  }, 60_000);
});
