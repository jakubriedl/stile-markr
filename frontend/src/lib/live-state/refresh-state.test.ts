import { describe, expect, it } from "vitest";

import { initialRefreshState, reduceRefreshState } from "./refresh-state.ts";

describe("reduceRefreshState", () => {
  it("announces stale once and recovery once after a prior success", () => {
    const loaded = reduceRefreshState(initialRefreshState, {
      type: "success",
      at: "2026-07-18T09:59:00.000Z",
    });

    const stale = reduceRefreshState(loaded, { type: "failure" });
    expect(stale.phase).toBe("stale");
    // Stale copy is shown by RefreshNotice; reducer keeps announcement empty.
    expect(stale.announcement).toBeNull();

    const staleAgain = reduceRefreshState(stale, { type: "failure" });
    expect(staleAgain.announcement).toBeNull();

    const recovered = reduceRefreshState(staleAgain, {
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(recovered.phase).toBe("fresh");
    expect(recovered.announcement).toBe("Back online. Results are up to date.");
    expect(recovered.lastRefreshedAt).toBe("2026-07-18T10:00:00.000Z");
  });

  it("ignores failure before any successful paint", () => {
    const failed = reduceRefreshState(initialRefreshState, { type: "failure" });
    expect(failed.phase).toBe("fresh");
    expect(failed.announcement).toBeNull();
    expect(failed.lastRefreshedAt).toBeNull();
  });

  it("can announce list changes after a fresh success", () => {
    const next = reduceRefreshState(initialRefreshState, {
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
      changedAnnouncement: "Test list updated. 2 tests available.",
    });
    expect(next.announcement).toBe("Test list updated. 2 tests available.");
  });

  it("clears announcements and accepts custom stale copy after a prior success", () => {
    const loaded = reduceRefreshState(initialRefreshState, {
      type: "success",
      at: "2026-07-18T09:59:00.000Z",
    });
    const announced = reduceRefreshState(loaded, {
      type: "failure",
      staleAnnouncement: "Custom stale message.",
    });
    expect(announced.announcement).toBe("Custom stale message.");

    const cleared = reduceRefreshState(announced, { type: "clearAnnouncement" });
    expect(cleared.announcement).toBeNull();
    expect(cleared.phase).toBe("stale");
  });
});
