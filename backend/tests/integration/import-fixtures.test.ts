import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { INVALID_XML_MESSAGE } from "../../src/features/import/types.ts";

const backendRoot = fileURLToPath(new URL("../..", import.meta.url));
const fixturesRoot = fileURLToPath(new URL("../fixtures/import", import.meta.url));

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
  tempDir = await mkdtemp(join(backendRoot, ".tmp-import-fixtures-"));
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

async function postImport(
  port: number,
  fixtureName: string,
  contentType = "text/xml+markr",
): Promise<Response> {
  const body = await readFile(join(fixturesRoot, fixtureName));
  return fetch(`http://127.0.0.1:${port}/import`, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

type SuccessCase = {
  fixture: string;
  contentType?: string;
  status: 200;
  body: { imported: number; test_ids: string[] };
};

type ErrorCase = {
  fixture: string;
  contentType?: string;
  status: 400 | 415;
  error?: string | RegExp;
  path?: string | RegExp;
  fix?: string | RegExp;
};

const successCases: SuccessCase[] = [
  {
    fixture: "valid-single-test.xml",
    status: 200,
    body: { imported: 1, test_ids: ["exam_a"] },
  },
  {
    fixture: "valid-multi-test.xml",
    status: 200,
    body: { imported: 3, test_ids: ["test_a", "test_b"] },
  },
  {
    fixture: "valid-duplicates-fold.xml",
    status: 200,
    body: { imported: 2, test_ids: ["fold_1"] },
  },
  {
    fixture: "huge-text-field.xml",
    status: 200,
    body: { imported: 1, test_ids: ["huge_1"] },
  },
];

const errorCases: ErrorCase[] = [
  {
    fixture: "broken-unclosed-tag.xml",
    status: 400,
    error: INVALID_XML_MESSAGE,
    path: /line/i,
    fix: /closing tag/i,
  },
  {
    fixture: "broken-wrong-root.xml",
    status: 400,
    error: /root element/i,
    path: /document root/i,
    fix: /mcq-test-results/i,
  },
  {
    fixture: "broken-missing-required.xml",
    status: 400,
    error: /missing required/i,
    path: /result #1/i,
    fix: /student-number/i,
  },
  {
    fixture: "broken-available-zero.xml",
    status: 400,
    error: /score values/i,
    path: /summary-marks/i,
    fix: /available/i,
  },
  {
    fixture: "broken-negative-marks.xml",
    status: 400,
    error: /score values/i,
    path: /summary-marks/i,
    fix: /obtained/i,
  },
  {
    fixture: "empty-mcq-results.xml",
    status: 400,
    error: /no student results/i,
    path: /mcq-test-results/i,
    fix: /mcq-test-result/i,
  },
  {
    fixture: "not-xml.txt",
    status: 400,
    error: INVALID_XML_MESSAGE,
    path: /line/i,
    fix: /closing tag|UTF-8/i,
  },
  {
    fixture: "not-xml.xml",
    status: 400,
    error: INVALID_XML_MESSAGE,
    path: /line/i,
    fix: /closing tag|UTF-8/i,
  },
  {
    fixture: "xml-but-wrong-content-type.xml",
    contentType: "application/xml",
    status: 415,
    error: /Markr XML format/i,
    path: /Content-Type/i,
    fix: /text\/xml\+markr/i,
  },
];

describe("import fixture suite", () => {
  it.each(successCases)(
    "imports $fixture",
    async ({ fixture, contentType, status, body }) => {
      const { port } = await startBackend();
      const response = await postImport(port, fixture, contentType);
      expect(response.status).toBe(status);
      await expect(response.json()).resolves.toEqual(body);
    },
  );

  it.each(errorCases)(
    "rejects $fixture with $status",
    async ({ fixture, contentType, status, error, path, fix }) => {
      const { port } = await startBackend();
      const response = await postImport(port, fixture, contentType);
      expect(response.status).toBe(status);
      const json = (await response.json()) as { error: string; path?: string; fix?: string };
      expect(json).toHaveProperty("error");
      if (error != null) {
        if (typeof error === "string") {
          expect(json.error).toBe(error);
        } else {
          expect(json.error).toMatch(error);
        }
      }
      if (path != null) {
        expect(json.path).toMatch(path);
      }
      if (fix != null) {
        expect(json.fix).toMatch(fix);
      }
    },
  );

  it("folds within-request duplicates to independent maxima", async () => {
    const { port } = await startBackend();
    const importResponse = await postImport(port, "valid-duplicates-fold.xml");
    expect(importResponse.status).toBe(200);

    const aggregateResponse = await fetch(`http://127.0.0.1:${port}/results/fold_1/aggregate`);
    expect(aggregateResponse.status).toBe(200);
    const aggregate = (await aggregateResponse.json()) as {
      count: number;
      mean: number;
      min: number;
      max: number;
    };
    // Student 42 retained 8/10 = 80%; student 99 retained 5/10 = 50%.
    expect(aggregate.count).toBe(2);
    expect(aggregate.min).toBe(50);
    expect(aggregate.max).toBe(80);
    expect(aggregate.mean).toBe(65);
  });
});
