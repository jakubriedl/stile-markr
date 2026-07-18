import type { RefreshEvent } from "./refresh-state.ts";

export type TestListSnapshotRow = {
  test_id: string;
  student_count: number;
  marks_available: number;
};

export type AggregateSnapshot = {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
};

export type HistogramBinSnapshot = {
  lower_pct: number;
  upper_pct: number;
  count: number;
};

/** Stable fingerprint of displayed list rows for LIST-006 change detection. */
export function fingerprintTestsList(tests: readonly TestListSnapshotRow[]): string {
  return [...tests]
    .map((test) => `${test.test_id}\t${test.student_count}\t${test.marks_available}`)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}

/** Stable fingerprint of displayed aggregate + histogram for DETAIL-007. */
export function fingerprintTestDetail(
  aggregate: AggregateSnapshot,
  bins: readonly HistogramBinSnapshot[],
): string {
  const binPart = bins.map((bin) => `${bin.lower_pct}:${bin.upper_pct}:${bin.count}`).join(",");
  return [
    aggregate.count,
    aggregate.mean,
    aggregate.stddev,
    aggregate.min,
    aggregate.max,
    aggregate.p25,
    aggregate.p50,
    aggregate.p75,
    binPart,
  ].join("|");
}

export function listChangeAnnouncement(
  previousFingerprint: string | null,
  nextFingerprint: string,
  testCount: number,
): string | null {
  if (previousFingerprint == null || previousFingerprint === nextFingerprint) {
    return null;
  }
  return `Test list updated. ${testCount} tests available.`;
}

export function detailChangeAnnouncement(
  previousFingerprint: string | null,
  nextFingerprint: string,
  studentCount: number,
): string | null {
  if (previousFingerprint == null || previousFingerprint === nextFingerprint) {
    return null;
  }
  return `Results were updated. ${studentCount} students.`;
}

export type PollSyncInput = {
  isError: boolean;
  fingerprint: string | null;
  previousFingerprint: string | null;
  changedAnnouncement: string | null;
  at: string;
};

export type PollSyncResult = {
  event: RefreshEvent;
  nextFingerprint: string | null;
};

/**
 * Shared list/detail poll → refresh-state transition.
 * Covered by unit tests so route shells can stay thin.
 */
export function syncRefreshFromPoll(input: PollSyncInput): PollSyncResult {
  if (input.isError) {
    return {
      event: { type: "failure" },
      nextFingerprint: input.previousFingerprint,
    };
  }

  if (input.fingerprint == null) {
    return {
      event: { type: "clearAnnouncement" },
      nextFingerprint: input.previousFingerprint,
    };
  }

  const changed = input.changedAnnouncement;
  return {
    event: changed
      ? {
          type: "success",
          at: input.at,
          changedAnnouncement: changed,
        }
      : { type: "success", at: input.at },
    nextFingerprint: input.fingerprint,
  };
}

/** Visible last-refreshed copy with an explicit UTC marker (LIST-007 / DETAIL-009). */
export function formatLastRefreshedUtc(isoTimestamp: string | null): string {
  if (isoTimestamp == null) {
    return "Not yet refreshed";
  }
  const normalized = isoTimestamp.endsWith("Z") ? isoTimestamp : `${isoTimestamp}Z`;
  return `${normalized} UTC`;
}
