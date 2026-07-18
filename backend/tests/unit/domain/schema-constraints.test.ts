import { DatabaseSync } from "node:sqlite";

import { getTableConfig } from "drizzle-orm/sqlite-core";
import { describe, expect, it } from "vitest";

import { importRequestKeys, results } from "../../../src/db/schema.ts";

function sqlLiteralText(value: { queryChunks: readonly unknown[] }): string {
  return value.queryChunks
    .flatMap((chunk) => {
      if (
        chunk != null &&
        typeof chunk === "object" &&
        "value" in chunk &&
        Array.isArray((chunk as { value: unknown }).value)
      ) {
        return (chunk as { value: string[] }).value;
      }
      return [];
    })
    .join("");
}

function createResultsTable(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE results (
      test_id TEXT NOT NULL,
      student_number INTEGER NOT NULL,
      obtained INTEGER NOT NULL,
      available INTEGER NOT NULL,
      first_name TEXT,
      last_name TEXT,
      scanned_on_ms INTEGER,
      created_at_ms INTEGER NOT NULL,
      updated_at_ms INTEGER NOT NULL,
      PRIMARY KEY (test_id, student_number),
      CHECK (length(test_id) > 0 AND test_id NOT GLOB '*[^a-z0-9_-]*'),
      CHECK (student_number >= 1 AND student_number <= 9007199254740991),
      CHECK (available > 0),
      CHECK (obtained >= 0 AND obtained <= available)
    );
  `);
}

describe("schema CHECK constraints", () => {
  it("declares NOT GLOB canonical test-id checks (GLOB '[class]*' is insufficient)", () => {
    const resultsConfig = getTableConfig(results);
    const requestKeysConfig = getTableConfig(importRequestKeys);

    const resultsCheck = resultsConfig.checks.find(
      (check) => check.name === "results_test_id_canonical",
    );
    const requestKeysCheck = requestKeysConfig.checks.find(
      (check) => check.name === "import_request_keys_test_id_canonical",
    );

    expect(sqlLiteralText(resultsCheck!.value)).toContain("NOT GLOB");
    expect(sqlLiteralText(requestKeysCheck!.value)).toContain("NOT GLOB");
  });

  it("rejects non-canonical test ids that start with a valid character", () => {
    const db = new DatabaseSync(":memory:");
    createResultsTable(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO results (
            test_id, student_number, obtained, available, created_at_ms, updated_at_ms
          ) VALUES (?, 1, 0, 1, 1, 1)`,
        )
        .run("exam!"),
    ).toThrow(/CHECK constraint failed/);

    db.prepare(
      `INSERT INTO results (
        test_id, student_number, obtained, available, created_at_ms, updated_at_ms
      ) VALUES (?, 1, 0, 1, 1, 1)`,
    ).run("exam_1-a");

    db.close();
  });

  it("rejects unsafe student numbers and unbounded marks", () => {
    const db = new DatabaseSync(":memory:");
    createResultsTable(db);

    expect(() =>
      db
        .prepare(
          `INSERT INTO results (
            test_id, student_number, obtained, available, created_at_ms, updated_at_ms
          ) VALUES ('exam', 0, 0, 1, 1, 1)`,
        )
        .run(),
    ).toThrow(/CHECK constraint failed/);

    expect(() =>
      db
        .prepare(
          `INSERT INTO results (
            test_id, student_number, obtained, available, created_at_ms, updated_at_ms
          ) VALUES ('exam', 1, 2, 1, 1, 1)`,
        )
        .run(),
    ).toThrow(/CHECK constraint failed/);

    db.close();
  });
});
