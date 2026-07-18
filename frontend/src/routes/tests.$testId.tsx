import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useReducer, useRef } from "react";

import { TestDetailPage } from "../features/tests/TestDetailPage.tsx";
import type { EtagCacheEntry } from "../lib/api/etag-fetch.ts";
import { createMarkrApi } from "../lib/api/markr-api.ts";
import { QUERY_POLL_INTERVAL_MS, queryKeys } from "../lib/api/query-keys.ts";
import type { AggregateResponse, HistogramResponse } from "../lib/api/types.ts";
import { initialRefreshState, reduceRefreshState } from "../lib/live-state/refresh-state.ts";

export const Route = createFileRoute("/tests/$testId")({
  component: TestDetailRoute,
});

const api = createMarkrApi();

function TestDetailRoute() {
  const { testId } = Route.useParams();
  const aggregateCache = useRef<EtagCacheEntry<AggregateResponse> | null>(null);
  const histogramCache = useRef<EtagCacheEntry<HistogramResponse> | null>(null);
  const [refresh, dispatch] = useReducer(reduceRefreshState, initialRefreshState);
  const previousCount = useRef<number | null>(null);

  const [aggregateQuery, histogramQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.aggregate(testId),
        queryFn: async () => {
          const result = await api.getAggregate(testId, aggregateCache.current);
          if (result.status === "error") {
            if (result.statusCode === 404) {
              return null;
            }
            throw new Error("Unable to load aggregate statistics.");
          }
          aggregateCache.current = { etag: result.etag, data: result.data };
          return result.data;
        },
        refetchInterval: QUERY_POLL_INTERVAL_MS,
      },
      {
        queryKey: queryKeys.histogram(testId),
        queryFn: async () => {
          const result = await api.getHistogram(testId, histogramCache.current);
          if (result.status === "error") {
            if (result.statusCode === 404) {
              return null;
            }
            throw new Error("Unable to load histogram.");
          }
          histogramCache.current = { etag: result.etag, data: result.data };
          return result.data;
        },
        refetchInterval: QUERY_POLL_INTERVAL_MS,
      },
    ],
  });

  const notFound = aggregateQuery.data === null || histogramQuery.data === null;
  const isError = aggregateQuery.isError || histogramQuery.isError;

  useEffect(() => {
    if (isError) {
      dispatch({ type: "failure" });
      return;
    }
    if (aggregateQuery.data) {
      const count = aggregateQuery.data.count;
      const changed =
        previousCount.current != null && previousCount.current !== count
          ? `Results were updated. ${count} students.`
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
  }, [aggregateQuery.data, isError, aggregateQuery.dataUpdatedAt]);

  return (
    <TestDetailPage
      testId={testId}
      aggregate={aggregateQuery.data ?? null}
      bins={histogramQuery.data?.bins ?? []}
      lastRefreshedAt={refresh.lastRefreshedAt}
      stale={refresh.phase === "stale"}
      announcement={refresh.announcement}
      notFound={notFound}
      error={isError && aggregateQuery.data == null ? "Unable to load test details." : null}
      onRetry={() => {
        void aggregateQuery.refetch();
        void histogramQuery.refetch();
      }}
    />
  );
}
