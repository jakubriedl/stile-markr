import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef } from "react";

import { TestsListPage } from "../features/tests/TestsListPage.tsx";
import type { EtagCacheEntry } from "../lib/api/etag-fetch.ts";
import { createMarkrApi } from "../lib/api/markr-api.ts";
import { QUERY_POLL_INTERVAL_MS, queryKeys } from "../lib/api/query-keys.ts";
import type { TestsResponse } from "../lib/api/types.ts";
import {
  fingerprintTestsList,
  listChangeAnnouncement,
  syncRefreshFromPoll,
} from "../lib/live-state/displayed-snapshots.ts";
import { initialRefreshState, reduceRefreshState } from "../lib/live-state/refresh-state.ts";

export const Route = createFileRoute("/tests/")({
  component: TestsRoute,
});

const api = createMarkrApi();

function TestsRoute() {
  const cacheRef = useRef<EtagCacheEntry<TestsResponse> | null>(null);
  const [refresh, dispatch] = useReducer(reduceRefreshState, initialRefreshState);
  const previousFingerprint = useRef<string | null>(null);

  const query = useQuery({
    queryKey: queryKeys.tests,
    queryFn: async () => {
      const result = await api.getTests(cacheRef.current);
      if (result.status === "error") {
        throw new Error("Unable to load tests.");
      }
      cacheRef.current = { etag: result.etag, data: result.data };
      return result.data;
    },
    refetchInterval: QUERY_POLL_INTERVAL_MS,
    // Finite retries so prolonged backend outages can enter the stale/error UI.
    retry: 1,
  });

  useEffect(() => {
    const fingerprint = query.data ? fingerprintTestsList(query.data.tests) : null;
    const synced = syncRefreshFromPoll({
      isError: query.isError,
      fingerprint,
      previousFingerprint: previousFingerprint.current,
      changedAnnouncement:
        fingerprint == null
          ? null
          : listChangeAnnouncement(
              previousFingerprint.current,
              fingerprint,
              query.data?.tests.length ?? 0,
            ),
      at: new Date().toISOString(),
    });
    previousFingerprint.current = synced.nextFingerprint;
    dispatch(synced.event);
  }, [query.data, query.isError, query.dataUpdatedAt]);

  return (
    <TestsListPage
      tests={query.data?.tests ?? []}
      lastRefreshedAt={refresh.lastRefreshedAt}
      stale={refresh.phase === "stale"}
      announcement={refresh.announcement}
      error={
        query.isError && !query.data
          ? "Couldn't load the test list. Check your connection and try again."
          : null
      }
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
