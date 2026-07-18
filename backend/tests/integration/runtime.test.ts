import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const backendDirectory = fileURLToPath(new URL("../..", import.meta.url));

let childProcess: ReturnType<typeof spawn> | undefined;

afterEach(async () => {
  if (childProcess?.exitCode === null) {
    childProcess.kill("SIGTERM");
    await once(childProcess, "exit");
  }
  childProcess = undefined;
});

describe("selected backend runtime", () => {
  it("starts on an ephemeral port, reports health, and shuts down", async () => {
    childProcess = spawn("bun", ["src/server.ts"], {
      cwd: backendDirectory,
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const port = await readReadyPort(childProcess);
    const response = await fetch(`http://127.0.0.1:${port}/health`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });

    childProcess.kill("SIGTERM");
    const [exitCode] = (await once(childProcess, "exit")) as [number | null];
    expect(exitCode).toBe(0);
  });

  it("supports Drizzle transactions and SQLite WAL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "markr-runtime-gate-"));
    const databasePath = join(directory, "gate.sqlite");

    try {
      const result = spawnSync("bun", ["src/runtime-gate/sqlite.ts", databasePath], {
        cwd: backendDirectory,
        encoding: "utf8",
      });

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("runtime-sqlite-gate:ok");
      await expect(readFile(databasePath)).resolves.not.toHaveLength(0);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("emits structured evlog events under Bun", () => {
    const result = spawnSync("bun", ["src/runtime-gate/evlog.ts"], {
      cwd: backendDirectory,
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("runtime-evlog-gate:ok");
  });

  it("preserves OpenTelemetry context through asynchronous Hono work", () => {
    const result = spawnSync("bun", ["src/runtime-gate/otel.ts"], {
      cwd: backendDirectory,
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("runtime-otel-gate:ok");
  });
});

async function readReadyPort(process: ReturnType<typeof spawn>): Promise<number> {
  if (!process.stdout || !process.stderr) {
    throw new Error("Runtime process pipes are unavailable");
  }

  let output = "";
  const errors: string[] = [];
  process.stderr.setEncoding("utf8");
  process.stderr.on("data", (chunk: string) => errors.push(chunk));

  process.stdout.setEncoding("utf8");
  for await (const chunk of process.stdout) {
    output += chunk;
    const match = /Markr backend ready.*port: (?<port>\d+)/s.exec(output);
    const port = match?.groups?.port;
    if (port) {
      return Number(port);
    }
  }

  throw new Error(`Backend exited before readiness: ${errors.join("")}`);
}
