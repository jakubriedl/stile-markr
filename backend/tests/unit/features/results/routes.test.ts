import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { createResultsRoutes } from "../../../../src/features/results/routes.ts";
import type { ResultsDatabase } from "../../../../src/features/results/queries.ts";

function openApp() {
  const sqlite = new DatabaseSync(":memory:");
  const migration = readFileSync(
    fileURLToPath(new URL("../../../../drizzle/0000_initial_results.sql", import.meta.url)),
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  sqlite.exec(migration);
  sqlite
    .prepare(
      `INSERT INTO results (
        test_id, student_number, obtained, available, created_at_ms, updated_at_ms
      ) VALUES ('9863', 1, 10, 20, 1, 1)`,
    )
    .run();

  const db: ResultsDatabase = {
    all<T extends Record<string, unknown>>(
      query: string,
      params: readonly (string | number)[] = [],
    ): T[] {
      return sqlite.prepare(query).all(...params) as T[];
    },
  };

  return {
    app: createResultsRoutes({ getReadDb: () => db }),
    close: () => sqlite.close(),
  };
}

describe("createResultsRoutes", () => {
  it("lists tests and supports aggregate/histogram ETags", async () => {
    const { app, close } = openApp();

    const list = await app.request("/tests");
    expect(list.status).toBe(200);
    await expect(list.json()).resolves.toEqual({
      tests: [{ test_id: "9863", student_count: 1, marks_available: 20 }],
    });
    const listEtag = list.headers.get("ETag");
    expect(listEtag).toBeTruthy();

    const notModified = await app.request("/tests", {
      headers: { "If-None-Match": listEtag! },
    });
    expect(notModified.status).toBe(304);

    const aggregate = await app.request("/results/9863/aggregate");
    expect(aggregate.status).toBe(200);
    const body = (await aggregate.json()) as { count: number; mean: number };
    expect(body.count).toBe(1);
    expect(body.mean).toBe(50);

    const missing = await app.request("/results/missing/histogram");
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toEqual({ error: "Not found" });

    close();
  });
});
