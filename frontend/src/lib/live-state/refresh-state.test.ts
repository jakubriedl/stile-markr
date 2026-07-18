import { describe, expect, it } from "vitest";

import { initialRefreshState, reduceRefreshState } from "./refresh-state.ts";

describe("reduceRefreshState", () => {
  it("announces stale once and recovery once", () => {
    const stale = reduceRefreshState(initialRefreshState, { type: "failure" });
    expect(stale.phase).toBe("stale");
    expect(stale.announcement).toMatch(/Unable to refresh/);

    const staleAgain = reduceRefreshState(stale, { type: "failure" });
    expect(staleAgain.announcement).toBeNull();

    const recovered = reduceRefreshState(staleAgain, {
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
    });
    expect(recovered.phase).toBe("fresh");
    expect(recovered.announcement).toMatch(/Connection restored/);
    expect(recovered.lastRefreshedAt).toBe("2026-07-18T10:00:00.000Z");
  });

  it("can announce list changes after a fresh success", () => {
    const next = reduceRefreshState(initialRefreshState, {
      type: "success",
      at: "2026-07-18T10:00:00.000Z",
      changedAnnouncement: "Test list updated. 2 tests available.",
    });
    expect(next.announcement).toBe("Test list updated. 2 tests available.");
  });
});
