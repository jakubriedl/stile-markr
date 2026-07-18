import { describe, expect, it } from "vitest";

import { applyDetailPollTransition, initialDetailLiveSession } from "./detail-live-session.ts";
import { fingerprintTestDetail } from "./displayed-snapshots.ts";

const aggregateA = {
  mean: 50,
  stddev: 10,
  min: 30,
  max: 75,
  p25: 45,
  p50: 50,
  p75: 55,
  count: 81,
};

const aggregateB = {
  ...aggregateA,
  mean: 60,
  max: 90,
  count: 40,
};

const binsA = [{ lower_pct: 40, upper_pct: 50, count: 28 }];
const binsB = [{ lower_pct: 50, upper_pct: 60, count: 12 }];

describe("detail live session", () => {
  it("does not announce a change on the first successful paint after testId navigation", () => {
    const fingerprintA = fingerprintTestDetail(aggregateA, binsA);
    const fingerprintB = fingerprintTestDetail(aggregateB, binsB);

    let session = applyDetailPollTransition(initialDetailLiveSession, {
      testId: "9863",
      isError: false,
      fingerprint: fingerprintA,
      studentCount: 81,
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(session.refresh.announcement).toBeNull();
    expect(session.previousFingerprint).toBe(fingerprintA);

    session = applyDetailPollTransition(session, {
      testId: "9864",
      isError: false,
      fingerprint: null,
      studentCount: 0,
      at: "2026-07-18T10:00:01.000Z",
    });
    expect(session.testId).toBe("9864");
    expect(session.previousFingerprint).toBeNull();
    expect(session.refresh).toEqual(initialDetailLiveSession.refresh);

    session = applyDetailPollTransition(session, {
      testId: "9864",
      isError: false,
      fingerprint: fingerprintB,
      studentCount: 40,
      at: "2026-07-18T10:00:02.000Z",
    });
    expect(session.refresh.announcement).toBeNull();
    expect(session.refresh.phase).toBe("fresh");
    expect(session.previousFingerprint).toBe(fingerprintB);
  });

  it("does not announce connection restored when entering a new test after a stale prior test", () => {
    const fingerprintA = fingerprintTestDetail(aggregateA, binsA);
    const fingerprintB = fingerprintTestDetail(aggregateB, binsB);

    let session = applyDetailPollTransition(initialDetailLiveSession, {
      testId: "9863",
      isError: false,
      fingerprint: fingerprintA,
      studentCount: 81,
      at: "2026-07-18T10:00:00.000Z",
    });
    session = applyDetailPollTransition(session, {
      testId: "9863",
      isError: true,
      fingerprint: fingerprintA,
      studentCount: 81,
      at: "2026-07-18T10:00:01.000Z",
    });
    expect(session.refresh.phase).toBe("stale");
    expect(session.refresh.announcement).toBe("Unable to refresh. Showing previously loaded data.");

    session = applyDetailPollTransition(session, {
      testId: "9864",
      isError: false,
      fingerprint: fingerprintB,
      studentCount: 40,
      at: "2026-07-18T10:00:02.000Z",
    });
    expect(session.refresh.phase).toBe("fresh");
    expect(session.refresh.announcement).toBeNull();
    expect(session.refresh.lastRefreshedAt).toBe("2026-07-18T10:00:02.000Z");
  });
});
