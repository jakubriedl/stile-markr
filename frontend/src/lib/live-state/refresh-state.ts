export type RefreshPhase = "fresh" | "stale" | "recovering";

export type RefreshState = {
  phase: RefreshPhase;
  lastRefreshedAt: string | null;
  announcement: string | null;
};

export type RefreshEvent =
  | { type: "success"; at: string; changedAnnouncement?: string }
  | { type: "failure"; staleAnnouncement?: string }
  | { type: "clearAnnouncement" };

export const initialRefreshState: RefreshState = {
  phase: "fresh",
  lastRefreshedAt: null,
  announcement: null,
};

/**
 * One-time stale/recovery announcements for list/detail polling.
 * Repeated failures do not re-announce; recovery announces once.
 */
export function reduceRefreshState(state: RefreshState, event: RefreshEvent): RefreshState {
  switch (event.type) {
    case "clearAnnouncement":
      return { ...state, announcement: null };
    case "success": {
      const recovering = state.phase === "stale" || state.phase === "recovering";
      return {
        phase: "fresh",
        lastRefreshedAt: event.at,
        announcement: recovering
          ? "Connection restored. Showing updated results."
          : (event.changedAnnouncement ?? null),
      };
    }
    case "failure":
      if (state.phase === "stale" || state.phase === "recovering") {
        return { ...state, announcement: null };
      }
      return {
        ...state,
        phase: "stale",
        announcement:
          event.staleAnnouncement ?? "Unable to refresh. Showing previously loaded data.",
      };
    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
