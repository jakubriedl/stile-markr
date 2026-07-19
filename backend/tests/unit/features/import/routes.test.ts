import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  createImportRoutes,
  type ImportRouteDependencies,
} from "../../../../src/features/import/routes.ts";
import type { ImportWriteDatabase } from "../../../../src/features/import/persist.ts";

function openDeps(): ImportRouteDependencies & { close: () => void } {
  const sqlite = new DatabaseSync(":memory:");
  const migration = readFileSync(
    fileURLToPath(new URL("../../../../drizzle/0000_initial_results.sql", import.meta.url)),
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  sqlite.exec(migration);
  const db: ImportWriteDatabase = {
    exec: (sql) => sqlite.exec(sql),
    prepare: (sql) => {
      const statement = sqlite.prepare(sql);
      return {
        get: (...params) => statement.get(...params) as Record<string, unknown> | undefined,
        run: (...params) => statement.run(...params),
        all: (...params) => statement.all(...params) as Record<string, unknown>[],
      };
    },
  };
  return {
    getWriteDb: () => db,
    close: () => sqlite.close(),
  };
}

describe("createImportRoutes", () => {
  it("imports a valid document and rejects unsupported media types", async () => {
    const deps = openDeps();
    const app = createImportRoutes(deps);

    const unsupported = await app.request("/import", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: "<mcq-test-results></mcq-test-results>",
    });
    expect(unsupported.status).toBe(415);

    const xml = `<?xml version="1.0"?>
      <mcq-test-results>
        <mcq-test-result>
          <student-number>1</student-number>
          <test-id>t1</test-id>
          <summary-marks available="5" obtained="4" />
        </mcq-test-result>
        <mcq-test-result>
          <student-number>1</student-number>
          <test-id>t1</test-id>
          <summary-marks available="6" obtained="2" />
        </mcq-test-result>
      </mcq-test-results>`;

    const response = await app.request("/import", {
      method: "POST",
      headers: { "Content-Type": "text/xml+markr; charset=utf-8" },
      body: xml,
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ imported: 1, test_ids: ["t1"] });
    expect(response.headers.get("content-type")).toContain("application/json");
    deps.close();
  });

  it("returns the exact malformed XML contract", async () => {
    const deps = openDeps();
    const app = createImportRoutes(deps);
    const response = await app.request("/import", {
      method: "POST",
      headers: { "Content-Type": "text/xml+markr" },
      body: "<mcq-test-results><oops></mcq-test-results>",
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid XML format" });
    deps.close();
  });
});
