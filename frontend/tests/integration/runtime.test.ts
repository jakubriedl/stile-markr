import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, type Browser } from "playwright";
import { afterEach, describe, expect, it } from "vitest";

const frontendDirectory = fileURLToPath(new URL("../..", import.meta.url));
const backendDirectory = fileURLToPath(new URL("../../../backend", import.meta.url));

const processes: Array<ReturnType<typeof spawn>> = [];
let browser: Browser | undefined;

afterEach(async () => {
  await browser?.close();
  browser = undefined;

  await Promise.all(
    processes.splice(0).map(async (child) => {
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await once(child, "exit");
      }
    }),
  );
});

describe("Bun TanStack Start runtime", () => {
  it(
    "hydrates, streams the proxy, applies headers, and blocks host escape",
    { timeout: 20_000 },
    async () => {
      const backend = spawn("bun", ["tests/runtime/server.ts"], {
        cwd: backendDirectory,
        stdio: ["ignore", "pipe", "pipe"],
      });
      processes.push(backend);
      const backendPort = await readPort(backend, /runtime-server-ready.*port: (?<port>\d+)/s);

      const frontendEnvironment = {
        ...process.env,
        BACKEND_URL: `http://127.0.0.1:${backendPort}`,
        HOST: "127.0.0.1",
        NODE_ENV: "production",
        PORT: String(await reservePort()),
        VITEST: undefined,
        VITEST_WORKER_ID: undefined,
      };
      const baseUrl = `http://127.0.0.1:${frontendEnvironment.PORT}`;
      const frontend = spawn("bun", [join(frontendDirectory, ".output/server/index.mjs")], {
        cwd: frontendDirectory,
        env: frontendEnvironment,
        stdio: ["ignore", "pipe", "pipe"],
      });
      processes.push(frontend);
      await waitForServer(baseUrl, frontend);

      const parentTraceId = "4bf92f3577b34da6a3ce929d0e0e4736";
      const parentSpanId = "00f067aa0ba902b7";
      let releaseRequest: (() => void) | undefined;
      const streamResponsePromise = fetch(`${baseUrl}/api/stream`, {
        body: new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new Uint8Array(19));
            releaseRequest = () => {
              controller.enqueue(new Uint8Array(23));
              controller.close();
            };
          },
        }),
        duplex: "half",
        headers: {
          traceparent: `00-${parentTraceId}-${parentSpanId}-01`,
        },
        method: "POST",
      } as RequestInit & { duplex: "half" });
      await waitForObservedRequestBytes(backendPort, 19);
      releaseRequest?.();
      const streamResponse = await streamResponsePromise;
      expect(streamResponse.status).toBe(200);
      const streamBody = (await streamResponse.json()) as {
        bytes: number;
        traceparent: string;
      };
      expect(streamBody.bytes).toBe(42);
      const [, traceId, proxySpanId] = streamBody.traceparent.split("-");
      expect(traceId).toBe(parentTraceId);
      expect(proxySpanId).toMatch(/^[a-f0-9]{16}$/);
      expect(proxySpanId).not.toBe(parentSpanId);
      expect(streamResponse.headers.get("content-security-policy")).toContain("default-src 'self'");

      const progressiveResponse = await fetch(`${baseUrl}/api/response-stream`);
      const progressiveReader = progressiveResponse.body?.getReader();
      if (!progressiveReader) {
        throw new Error("Progressive response body is unavailable");
      }
      const firstChunk = await progressiveReader.read();
      expect(new TextDecoder().decode(firstChunk.value)).toBe("first\n");
      let secondChunkResolved = false;
      const secondChunkPromise = progressiveReader.read().then((chunk) => {
        secondChunkResolved = true;
        return chunk;
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(secondChunkResolved).toBe(false);
      const releaseResponse = await fetch(`http://127.0.0.1:${backendPort}/release-response`, {
        method: "POST",
      });
      expect(releaseResponse.status).toBe(200);
      const secondChunk = await secondChunkPromise;
      expect(new TextDecoder().decode(secondChunk.value)).toBe("second\n");

      const ssrResponse = await fetch(baseUrl);
      const initialHtml = await ssrResponse.text();
      expect(initialHtml).toContain("Upload exam results");
      expect(initialHtml).toMatch(/<h1[^>]*>Upload exam results<\/h1>/);

      let hostEscapeRequests = 0;
      const hostEscapeTarget = createServer((_request, response) => {
        hostEscapeRequests += 1;
        response.end("escaped");
      });
      hostEscapeTarget.listen(0, "127.0.0.1");
      await once(hostEscapeTarget, "listening");
      const address = hostEscapeTarget.address();
      if (!address || typeof address === "string") {
        throw new Error("Host-escape test server did not bind");
      }

      try {
        const escapeResponse = await fetch(`${baseUrl}/api//127.0.0.1:${address.port}/probe`);
        expect(escapeResponse.status).toBe(400);
        expect(hostEscapeRequests).toBe(0);
      } finally {
        hostEscapeTarget.close();
        await once(hostEscapeTarget, "close");
      }

      const executablePath = process.env.MARKR_CHROMIUM_EXECUTABLE_PATH;
      if (!executablePath) {
        throw new Error("Chromium executable path is not configured");
      }
      browser = await chromium.launch({
        executablePath,
        headless: true,
      });
      const page = await browser.newPage();
      const consoleErrors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });

      const navigationResponse = await page.goto(baseUrl);
      expect(navigationResponse?.status()).toBe(200);
      expect(navigationResponse?.headers()["content-security-policy"]).toContain(
        "default-src 'self'",
      );
      await page
        .getByRole("heading", { name: "Upload exam results" })
        .waitFor({ state: "visible" });
      await page.getByRole("link", { name: "View tests" }).click();
      await page.getByRole("heading", { name: "Tests" }).waitFor({ state: "visible" });

      const navigationCount = await page.evaluate(
        () => performance.getEntriesByType("navigation").length,
      );
      expect(navigationCount).toBe(1);
      expect(consoleErrors).toEqual([]);
    },
  );
});

async function readPort(process: ReturnType<typeof spawn>, pattern: RegExp): Promise<number> {
  if (!process.stdout || !process.stderr) {
    throw new Error("Runtime process pipes are unavailable");
  }

  process.stderr.setEncoding("utf8");
  const errors: string[] = [];
  process.stderr.on("data", (chunk: string) => errors.push(chunk));
  process.stdout.setEncoding("utf8");

  let output = "";
  for await (const chunk of process.stdout) {
    output += chunk;
    const port = pattern.exec(output)?.groups?.port;
    if (port) {
      return Number(port);
    }
  }

  throw new Error(`Runtime exited before readiness: ${errors.join("")}`);
}

async function reservePort(): Promise<number> {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to reserve a frontend port");
  }
  const port = address.port;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

async function waitForServer(baseUrl: string, process: ReturnType<typeof spawn>): Promise<void> {
  const errors: string[] = [];
  process.stderr?.setEncoding("utf8");
  process.stderr?.on("data", (chunk: string) => errors.push(chunk));

  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (process.exitCode !== null) {
      throw new Error(`Frontend exited before readiness: ${errors.join("")}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // The listener may not be bound yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Frontend did not become ready: ${errors.join("")}`);
}

async function waitForObservedRequestBytes(
  backendPort: number,
  expectedBytes: number,
): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await fetch(`http://127.0.0.1:${backendPort}/stream-status`);
    const body = (await response.json()) as { bytes: number };
    if (body.bytes === expectedBytes) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error(`Backend did not observe the first ${expectedBytes} request bytes`);
}
