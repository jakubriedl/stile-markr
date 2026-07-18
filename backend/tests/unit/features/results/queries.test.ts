import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { contentEtag, etagMatches } from "../../../../src/features/results/etag.ts";
import {
  getAggregate,
  getHistogram,
  listTests,
  type ResultsDatabase,
} from "../../../../src/features/results/queries.ts";

function openMigratedDb(): { db: ResultsDatabase; close: () => void } {
  const sqlite = new DatabaseSync(":memory:");
  const migrationPath = fileURLToPath(
    new URL("../../../../drizzle/0000_initial_results.sql", import.meta.url),
  );
  const migration = readFileSync(migrationPath, "utf8").replaceAll("--> statement-breakpoint", "");
  sqlite.exec(migration);

  const db: ResultsDatabase = {
    all<T extends Record<string, unknown>>(
      query: string,
      params: readonly (string | number)[] = [],
    ): T[] {
      return sqlite.prepare(query).all(...params) as T[];
    },
  };

  return {
    db,
    close: () => sqlite.close(),
  };
}

function insertResult(
  db: ResultsDatabase,
  row: {
    testId: string;
    studentNumber: number;
    obtained: number;
    available: number;
  },
) {
  db.all(
    `INSERT INTO results (
      test_id, student_number, obtained, available, created_at_ms, updated_at_ms
    ) VALUES (?, ?, ?, ?, 1, 1)`,
    [row.testId, row.studentNumber, row.obtained, row.available],
  );
}

describe("results queries", () => {
  it("lists tests ordered by canonical id and reports empty lists", () => {
    const { db, close } = openMigratedDb();

    expect(listTests(db)).toEqual([]);

    insertResult(db, {
      testId: "b-test",
      studentNumber: 1,
      obtained: 1,
      available: 2,
    });
    insertResult(db, {
      testId: "a-test",
      studentNumber: 2,
      obtained: 2,
      available: 5,
    });
    insertResult(db, {
      testId: "a-test",
      studentNumber: 3,
      obtained: 1,
      available: 4,
    });

    expect(listTests(db)).toEqual([
      { test_id: "a-test", student_count: 2, marks_available: 5 },
      { test_id: "b-test", student_count: 1, marks_available: 2 },
    ]);

    close();
  });

  it("returns not_found for unknown or invalid test ids", () => {
    const { db, close } = openMigratedDb();
    expect(getAggregate(db, "missing")).toEqual({ ok: false, code: "not_found" });
    expect(getHistogram(db, "bad id")).toEqual({ ok: false, code: "not_found" });
    close();
  });

  it("loads score CTE percentages and keeps aggregate/histogram totals aligned", () => {
    const { db, close } = openMigratedDb();

    const obtainedValues = [
      6,
      6,
      6,
      6,
      6,
      6, // 30% → bin 3
      ...Array.from({ length: 28 }, () => 8), // 40%
      ...Array.from({ length: 28 }, () => 10), // 50%
      ...Array.from({ length: 14 }, () => 12), // 60%
      ...Array.from({ length: 5 }, () => 14), // 70%
    ];
    expect(obtainedValues).toHaveLength(81);

    for (const [index, obtained] of obtainedValues.entries()) {
      insertResult(db, {
        testId: "9863",
        studentNumber: index + 1,
        obtained,
        available: 20,
      });
    }

    const aggregate = getAggregate(db, "9863");
    expect(aggregate.ok).toBe(true);
    if (aggregate.ok) {
      expect(aggregate.value.count).toBe(81);
      expect(aggregate.value.min).toBe(30);
      expect(aggregate.value.max).toBe(70);
      expect(aggregate.value.p25).toBe(40);
      expect(aggregate.value.p50).toBe(50);
      expect(aggregate.value.p75).toBe(50);
      expect(aggregate.value.mean).toBeCloseTo(
        obtainedValues.reduce((sum, value) => sum + (value / 20) * 100, 0) / 81,
        10,
      );
    }

    const histogram = getHistogram(db, "9863");
    expect(histogram.ok).toBe(true);
    if (histogram.ok) {
      expect(histogram.value.total).toBe(81);
      expect(histogram.value.bins.map((bin) => bin.count)).toEqual([
        0, 0, 0, 6, 28, 28, 14, 5, 0, 0,
      ]);
      expect(histogram.value.bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(
        aggregate.ok ? aggregate.value.count : -1,
      );
    }

    expect(getAggregate(db, "9863").ok).toBe(true);

    close();
  });
});

describe("contentEtag", () => {
  it("is stable for identical payloads and matches If-None-Match tokens", () => {
    const etag = contentEtag({ count: 1, mean: 50 });
    expect(etag).toBe(contentEtag({ count: 1, mean: 50 }));
    expect(etag).not.toBe(contentEtag({ count: 2, mean: 50 }));
    expect(etagMatches(etag, etag)).toBe(true);
    expect(etagMatches(`W/${etag}, "other"`, etag)).toBe(true);
    expect(etagMatches(null, etag)).toBe(false);
  });
});
