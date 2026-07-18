import { describe, expect, it } from "vitest";

import {
  detailChangeAnnouncement,
  fingerprintTestDetail,
  fingerprintTestsList,
  formatLastRefreshedUtc,
  listChangeAnnouncement,
  syncRefreshFromPoll,
} from "./displayed-snapshots.ts";
import { initialRefreshState, reduceRefreshState } from "./refresh-state.ts";

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

  it("treats initial poll errors as non-stale so first success stays silent", () => {
    const initialError = syncRefreshFromPoll({
      isError: true,
      fingerprint: null,
      previousFingerprint: null,
      changedAnnouncement: null,
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(initialError.event).toEqual({ type: "clearAnnouncement" });
    expect(initialError.nextFingerprint).toBeNull();

    let refresh = reduceRefreshState(initialRefreshState, initialError.event);
    expect(refresh.phase).toBe("fresh");
    expect(refresh.announcement).toBeNull();

    const firstSuccess = syncRefreshFromPoll({
      isError: false,
      fingerprint: "loaded",
      previousFingerprint: null,
      changedAnnouncement: null,
      at: "2026-07-18T10:00:01.000Z",
    });
    refresh = reduceRefreshState(refresh, firstSuccess.event);
    expect(refresh.phase).toBe("fresh");
    expect(refresh.announcement).toBeNull();
    expect(refresh.lastRefreshedAt).toBe("2026-07-18T10:00:01.000Z");
  });

  it("still announces stale then recovery after a successful paint", () => {
    let refresh = reduceRefreshState(initialRefreshState, {
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
    });
    const failed = syncRefreshFromPoll({
      isError: true,
      fingerprint: null,
      previousFingerprint: "loaded",
      changedAnnouncement: null,
      at: "2026-07-18T10:00:01.000Z",
    });
    refresh = reduceRefreshState(refresh, failed.event);
    expect(refresh.phase).toBe("stale");
    expect(refresh.announcement).toMatch(/Unable to refresh/);

    const recovered = syncRefreshFromPoll({
      isError: false,
      fingerprint: "loaded",
      previousFingerprint: "loaded",
      changedAnnouncement: null,
      at: "2026-07-18T10:00:02.000Z",
    });
    refresh = reduceRefreshState(refresh, recovered.event);
    expect(refresh.announcement).toMatch(/Connection restored/);
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

  it("fingerprints list rows order-independently", () => {
    const a = fingerprintTestsList([
      { test_id: "b", student_count: 1, marks_available: 10 },
      { test_id: "a", student_count: 2, marks_available: 20 },
    ]);
    const b = fingerprintTestsList([
      { test_id: "a", student_count: 2, marks_available: 20 },
      { test_id: "b", student_count: 1, marks_available: 10 },
    ]);
    expect(a).toBe(b);
  });

  it("clears announcements while waiting for the first successful payload", () => {
    const synced = syncRefreshFromPoll({
      isError: false,
      fingerprint: null,
      previousFingerprint: null,
      changedAnnouncement: null,
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(synced.event).toEqual({ type: "clearAnnouncement" });
    expect(synced.nextFingerprint).toBeNull();
  });

  it("maps unchanged successful polls without a change announcement", () => {
    const synced = syncRefreshFromPoll({
      isError: false,
      fingerprint: "same",
      previousFingerprint: "same",
      changedAnnouncement: null,
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(synced.event).toEqual({
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(synced.nextFingerprint).toBe("same");
  });

  it("labels last refreshed timestamps as UTC", () => {
    expect(formatLastRefreshedUtc(null)).toBe("Not yet refreshed");
    expect(formatLastRefreshedUtc("2026-07-18T10:00:00.000Z")).toBe("2026-07-18T10:00:00.000Z UTC");
  });
});
