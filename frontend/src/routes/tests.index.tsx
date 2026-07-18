import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef } from "react";

import { TestsListPage } from "../features/tests/TestsListPage.tsx";
import { createMarkrApi } from "../lib/api/markr-api.ts";
import { QUERY_POLL_INTERVAL_MS, queryKeys } from "../lib/api/query-keys.ts";
import type { TestsResponse } from "../lib/api/types.ts";
import type { EtagCacheEntry } from "../lib/api/etag-fetch.ts";
import { initialRefreshState, reduceRefreshState } from "../lib/live-state/refresh-state.ts";

export const Route = createFileRoute("/tests/")({
  component: TestsRoute,
});

const api = createMarkrApi();

function TestsRoute() {
  const cacheRef = useRef<EtagCacheEntry<TestsResponse> | null>(null);
  const [refresh, dispatch] = useReducer(reduceRefreshState, initialRefreshState);
  const previousCount = useRef<number | null>(null);

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
    retry: true,
  });

  useEffect(() => {
    if (query.isError) {
      dispatch({ type: "failure" });
      return;
    }
    if (query.data) {
      const count = query.data.tests.length;
      const changed =
        previousCount.current != null && previousCount.current !== count
          ? `Test list updated. ${count} tests available.`
          : null;
      previousCount.current = count;
      dispatch(
        changed
          ? {
              type: "success",
              at: new Date().toISOString(),
              changedAnnouncement: changed,
            }
          : { type: "success", at: new Date().toISOString() },
      );
    }
  }, [query.data, query.isError, query.dataUpdatedAt]);

  return (
    <TestsListPage
      tests={query.data?.tests ?? []}
      lastRefreshedAt={refresh.lastRefreshedAt}
      stale={refresh.phase === "stale"}
      announcement={refresh.announcement}
      error={query.isError && !query.data ? "Unable to load tests." : null}
      onRetry={() => {
        void query.refetch();
      }}
    />
  );
}
