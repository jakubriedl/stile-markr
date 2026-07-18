import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const backendDirectory = fileURLToPath(new URL("../..", import.meta.url));
const runtimeMigrationsDirectory = fileURLToPath(
  new URL("../fixtures/runtime-migrations", import.meta.url),
);

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
    const directory = await mkdtemp(join(backendDirectory, ".tmp-runtime-health-"));
    const databasePath = join(directory, "markr.sqlite");

    try {
      childProcess = spawn("bun", ["src/server.ts"], {
        cwd: backendDirectory,
        env: { ...process.env, DATABASE_PATH: databasePath, PORT: "0" },
        stdio: ["ignore", "pipe", "pipe"],
      });

      const port = await readReadyPort(childProcess, /Markr backend ready.*port: (?<port>\d+)/s);
      const response = await fetch(`http://127.0.0.1:${port}/health`);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: "ok" });

      childProcess.kill("SIGTERM");
      const [exitCode] = (await once(childProcess, "exit")) as [number | null];
      expect(exitCode).toBe(0);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("supports Drizzle transactions and SQLite WAL", async () => {
    const directory = await mkdtemp(join(tmpdir(), "markr-runtime-gate-"));
    const databasePath = join(directory, "gate.sqlite");

    try {
      const result = spawnSync(
        "bun",
        ["tests/runtime/sqlite.ts", databasePath, runtimeMigrationsDirectory],
        {
          cwd: backendDirectory,
          encoding: "utf8",
        },
      );

      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout).toContain("runtime-sqlite-gate:ok");
      await expect(readFile(databasePath)).resolves.not.toHaveLength(0);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("emits structured evlog events under Bun", () => {
    const result = spawnSync("bun", ["tests/runtime/evlog.ts"], {
      cwd: backendDirectory,
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("runtime-evlog-gate:ok");
  });

  it("preserves OpenTelemetry context through asynchronous Hono work", () => {
    const result = spawnSync("bun", ["tests/runtime/otel.ts"], {
      cwd: backendDirectory,
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("runtime-otel-gate:ok");
  });

  it(
    "streams request bodies, rejects byte 52,428,801, and drains in-flight work",
    { timeout: 15_000 },
    async () => {
      childProcess = spawn("bun", ["tests/runtime/server.ts"], {
        cwd: backendDirectory,
        stdio: ["ignore", "pipe", "pipe"],
      });
      const port = await readReadyPort(childProcess, /runtime-server-ready.*port: (?<port>\d+)/s);

      const streamResponse = await fetch(`http://127.0.0.1:${port}/stream`, {
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(32));
            controller.enqueue(new Uint8Array(16));
            controller.close();
          },
        }),
        duplex: "half",
        method: "POST",
      } as RequestInit & { duplex: "half" });
      expect(streamResponse.status).toBe(200);
      await expect(streamResponse.json()).resolves.toEqual({
        bytes: 48,
        traceparent: null,
      });

      const oversizedResponse = await fetch(`http://127.0.0.1:${port}/stream`, {
        body: new Uint8Array(52_428_801),
        method: "POST",
      });
      expect(oversizedResponse.status).toBe(413);
      await expect(oversizedResponse.json()).resolves.toEqual({
        error: "Payload too large",
      });

      const slowResponsePromise = fetch(`http://127.0.0.1:${port}/slow`);
      await new Promise((resolve) => setTimeout(resolve, 25));
      childProcess.kill("SIGTERM");

      const slowResponse = await slowResponsePromise;
      expect(slowResponse.status).toBe(200);
      await expect(slowResponse.json()).resolves.toEqual({
        status: "completed",
      });
      const [exitCode] = (await once(childProcess, "exit")) as [number | null];
      expect(exitCode).toBe(0);
    },
  );
});

async function readReadyPort(process: ReturnType<typeof spawn>, pattern: RegExp): Promise<number> {
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
    const match = pattern.exec(output);
    const port = match?.groups?.port;
    if (port) {
      return Number(port);
    }
  }

  throw new Error(`Backend exited before readiness: ${errors.join("")}`);
}
