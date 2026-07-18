import { describe, expect, it } from "vitest";

import {
  detailChangeAnnouncement,
  fingerprintTestDetail,
  fingerprintTestsList,
  formatLastRefreshedUtc,
  listChangeAnnouncement,
  syncRefreshFromPoll,
} from "./displayed-snapshots.ts";

const sampleAggregate = {
  mean: 50,
  stddev: 10,
  min: 30,
  max: 75,
  p25: 45,
  p50: 50,
  p75: 55,
  count: 81,
};

describe("displayed snapshots", () => {
  it("announces list field updates even when length is unchanged", () => {
    const first = fingerprintTestsList([
      { test_id: "9863", student_count: 81, marks_available: 20 },
    ]);
    const second = fingerprintTestsList([
      { test_id: "9863", student_count: 82, marks_available: 20 },
    ]);

    expect(listChangeAnnouncement(null, first, 1)).toBeNull();
    expect(listChangeAnnouncement(first, first, 1)).toBeNull();
    expect(listChangeAnnouncement(first, second, 1)).toBe("Test list updated. 1 tests available.");
  });

  it("announces detail score updates when student count is unchanged", () => {
    const bins = [{ lower_pct: 40, upper_pct: 50, count: 28 }];
    const first = fingerprintTestDetail(sampleAggregate, bins);
    const second = fingerprintTestDetail({ ...sampleAggregate, mean: 51, max: 80 }, bins);

    expect(detailChangeAnnouncement(null, first, 81)).toBeNull();
    expect(detailChangeAnnouncement(first, first, 81)).toBeNull();
    expect(detailChangeAnnouncement(first, second, 81)).toBe("Results were updated. 81 students.");
  });

  it("maps poll errors to failure while preserving the prior fingerprint", () => {
    const synced = syncRefreshFromPoll({
      isError: true,
      fingerprint: "next",
      previousFingerprint: "prev",
      changedAnnouncement: null,
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(synced.event).toEqual({ type: "failure" });
    expect(synced.nextFingerprint).toBe("prev");
  });

  it("maps successful fingerprint changes to a success announcement event", () => {
    const synced = syncRefreshFromPoll({
      isError: false,
      fingerprint: "next",
      previousFingerprint: "prev",
      changedAnnouncement: "Test list updated. 2 tests available.",
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(synced.event).toEqual({
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
      changedAnnouncement: "Test list updated. 2 tests available.",
    });
    expect(synced.nextFingerprint).toBe("next");
  });

  it("labels last refreshed timestamps as UTC", () => {
    expect(formatLastRefreshedUtc(null)).toBe("Not yet refreshed");
    expect(formatLastRefreshedUtc("2026-07-18T10:00:00.000Z")).toBe("2026-07-18T10:00:00.000Z UTC");
  });
});
