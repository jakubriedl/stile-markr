import { detailChangeAnnouncement, syncRefreshFromPoll } from "./displayed-snapshots.ts";
import { initialRefreshState, reduceRefreshState, type RefreshState } from "./refresh-state.ts";

/** Per-test detail live/refresh session (DETAIL-008 / DETAIL-010). */
export type DetailLiveSession = {
  testId: string | null;
  previousFingerprint: string | null;
  refresh: RefreshState;
};

export const initialDetailLiveSession: DetailLiveSession = {
  testId: null,
  previousFingerprint: null,
  refresh: initialRefreshState,
};

export type DetailPollTransitionInput = {
  testId: string;
  isError: boolean;
  fingerprint: string | null;
  studentCount: number;
  at: string;
};

/**
 * Apply a poll result to detail live state, resetting fingerprint/refresh when
 * `testId` changes so cross-test navigation cannot announce false updates or
 * leak stale/recovery copy.
 */
export function applyDetailPollTransition(
  session: DetailLiveSession,
  input: DetailPollTransitionInput,
): DetailLiveSession {
  const scoped =
    session.testId === input.testId
      ? session
      : {
          testId: input.testId,
          previousFingerprint: null,
          refresh: initialRefreshState,
        };

  const changedAnnouncement =
    input.fingerprint == null
      ? null
      : detailChangeAnnouncement(scoped.previousFingerprint, input.fingerprint, input.studentCount);

  const synced = syncRefreshFromPoll({
    isError: input.isError,
    fingerprint: input.fingerprint,
    previousFingerprint: scoped.previousFingerprint,
    changedAnnouncement,
    at: input.at,
  });

  return {
    testId: input.testId,
    previousFingerprint: synced.nextFingerprint,
    refresh: reduceRefreshState(scoped.refresh, synced.event),
  };
}
