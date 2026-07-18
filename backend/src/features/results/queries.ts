import { canonicalizeTestId } from "../../domain/canonicalize.ts";
import { aggregateFromPercentages, buildHistogram } from "./statistics.ts";

export type AggregateStats = {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
};

export type HistogramBin = {
  lower_pct: number;
  upper_pct: number;
  count: number;
};

export type HistogramStats = {
  bins: HistogramBin[];
  total: number;
};

export type TestListItem = {
  test_id: string;
  student_count: number;
  marks_available: number;
};

export type QueryNotFound = { ok: false; code: "not_found" };
export type QueryFound<T> = { ok: true; value: T };
export type QueryResult<T> = QueryFound<T> | QueryNotFound;

/** Minimal SQL executor used by both Bun and Node SQLite drivers. */
export type ResultsDatabase = {
  all: <T extends Record<string, unknown>>(
    query: string,
    params?: readonly (string | number)[],
  ) => T[];
};

function loadPercentages(db: ResultsDatabase, testId: string): number[] {
  // Score CTE: obtained * 100.0 / available (ARCHITECTURE §8.4)
  const rows = db.all<{ pct: number }>(
    `
      WITH scores AS (
        SELECT (obtained * 100.0 / available) AS pct
        FROM results
        WHERE test_id = ?
      )
      SELECT pct FROM scores
    `,
    [testId],
  );
  return rows.map((row) => row.pct);
}

export function getAggregate(db: ResultsDatabase, rawTestId: string): QueryResult<AggregateStats> {
  const canonical = canonicalizeTestId(rawTestId);
  if (!canonical.ok) {
    return { ok: false, code: "not_found" };
  }

  const percentages = loadPercentages(db, canonical.value);
  if (percentages.length === 0) {
    return { ok: false, code: "not_found" };
  }

  return { ok: true, value: aggregateFromPercentages(percentages) };
}

export function getHistogram(db: ResultsDatabase, rawTestId: string): QueryResult<HistogramStats> {
  const canonical = canonicalizeTestId(rawTestId);
  if (!canonical.ok) {
    return { ok: false, code: "not_found" };
  }

  const percentages = loadPercentages(db, canonical.value);
  if (percentages.length === 0) {
    return { ok: false, code: "not_found" };
  }

  return { ok: true, value: buildHistogram(percentages) };
}

export function listTests(db: ResultsDatabase): TestListItem[] {
  return db.all<TestListItem>(
    `
      SELECT
        test_id AS test_id,
        COUNT(*) AS student_count,
        MAX(available) AS marks_available
      FROM results
      GROUP BY test_id
      ORDER BY test_id ASC
    `,
  );
}
