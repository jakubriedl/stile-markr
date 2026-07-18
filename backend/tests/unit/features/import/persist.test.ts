import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import type { RetainedResult } from "../../../../src/domain/result.ts";
import {
  persistImportRecords,
  type ImportWriteDatabase,
} from "../../../../src/features/import/persist.ts";

function openDb(): { db: ImportWriteDatabase; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(":memory:");
  const migration = readFileSync(
    fileURLToPath(new URL("../../../../drizzle/0000_initial_results.sql", import.meta.url)),
    "utf8",
  ).replaceAll("--> statement-breakpoint", "");
  sqlite.exec(migration);
  const db: ImportWriteDatabase = {
    exec: (sql) => {
      sqlite.exec(sql);
    },
    prepare: (sql) => {
      const statement = sqlite.prepare(sql);
      return {
        get: (...params) => statement.get(...params) as Record<string, unknown> | undefined,
        run: (...params) => statement.run(...params),
        all: (...params) => statement.all(...params) as Record<string, unknown>[],
      };
    },
  };
  return { db, sqlite };
}

function result(
  partial: Partial<RetainedResult> &
    Pick<RetainedResult, "studentNumber" | "obtained" | "available">,
): RetainedResult {
  return {
    testId: "exam",
    firstName: null,
    lastName: null,
    scannedOnMs: null,
    ...partial,
  };
}

describe("persistImportRecords", () => {
  it("counts unique pairs and retains independent maxima across imports", () => {
    const { db, sqlite } = openDb();

    const firstCount = persistImportRecords(
      db,
      [
        result({ studentNumber: 1, obtained: 4, available: 10, firstName: "A", scannedOnMs: 10 }),
        result({ studentNumber: 1, obtained: 9, available: 8, firstName: "B", scannedOnMs: 20 }),
        result({ studentNumber: 2, obtained: 1, available: 5 }),
      ],
      100,
    );

    expect(firstCount).toBe(2);

    const secondCount = persistImportRecords(
      db,
      [result({ studentNumber: 1, obtained: 3, available: 12, firstName: "C", scannedOnMs: 5 })],
      200,
    );
    expect(secondCount).toBe(1);

    const rows = sqlite.prepare("SELECT * FROM results ORDER BY student_number").all() as Array<{
      student_number: number;
      obtained: number;
      available: number;
      first_name: string | null;
      scanned_on_ms: number | null;
    }>;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      student_number: 1,
      obtained: 9,
      available: 12,
      first_name: "B",
      scanned_on_ms: 20,
    });
    expect(rows[1]).toMatchObject({ student_number: 2, obtained: 1, available: 5 });
    sqlite.close();
  });

  it("rolls back when the transaction fails", () => {
    const { db, sqlite } = openDb();
    const originalPrepare = db.prepare.bind(db);
    let upserts = 0;
    db.prepare = (sql) => {
      const statement = originalPrepare(sql);
      if (sql.includes("ON CONFLICT")) {
        return {
          ...statement,
          run: (...params) => {
            upserts += 1;
            if (upserts > 1) {
              throw new Error("forced failure");
            }
            return statement.run(...params);
          },
        };
      }
      return statement;
    };

    expect(() =>
      persistImportRecords(db, [
        result({ studentNumber: 1, obtained: 1, available: 1 }),
        result({ studentNumber: 2, obtained: 1, available: 1 }),
      ]),
    ).toThrow(/forced failure/);

    expect(sqlite.prepare("SELECT COUNT(*) AS count FROM results").get()).toEqual({ count: 0 });
    sqlite.close();
  });
});
