import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { TestDetailPage } from "../features/tests/TestDetailPage.tsx";
import type { EtagCacheEntry } from "../lib/api/etag-fetch.ts";
import { createMarkrApi } from "../lib/api/markr-api.ts";
import { QUERY_POLL_INTERVAL_MS, queryKeys } from "../lib/api/query-keys.ts";
import type { AggregateResponse, HistogramResponse } from "../lib/api/types.ts";
import { fingerprintTestDetail } from "../lib/live-state/displayed-snapshots.ts";
import {
  applyDetailPollTransition,
  initialDetailLiveSession,
} from "../lib/live-state/detail-live-session.ts";

export const Route = createFileRoute("/tests/$testId")({
  component: TestDetailRoute,
});

const api = createMarkrApi();

function TestDetailRoute() {
  const { testId } = Route.useParams();
  // Remount live state when the route param changes (router reuses this component).
  return <TestDetailLive key={testId} testId={testId} />;
}

function TestDetailLive({ testId }: { testId: string }) {
  const aggregateCaches = useRef(new Map<string, EtagCacheEntry<AggregateResponse>>());
  const histogramCaches = useRef(new Map<string, EtagCacheEntry<HistogramResponse>>());
  const [session, setSession] = useState(initialDetailLiveSession);

  const [aggregateQuery, histogramQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.aggregate(testId),
        queryFn: async () => {
          const result = await api.getAggregate(
            testId,
            aggregateCaches.current.get(testId) ?? null,
          );
          if (result.status === "error") {
            if (result.statusCode === 404) {
              return null;
            }
            throw new Error("Unable to load aggregate statistics.");
          }
          aggregateCaches.current.set(testId, { etag: result.etag, data: result.data });
          return result.data;
        },
        refetchInterval: QUERY_POLL_INTERVAL_MS,
        retry: 1,
      },
      {
        queryKey: queryKeys.histogram(testId),
        queryFn: async () => {
          const result = await api.getHistogram(
            testId,
            histogramCaches.current.get(testId) ?? null,
          );
          if (result.status === "error") {
            if (result.statusCode === 404) {
              return null;
            }
            throw new Error("Unable to load histogram.");
          }
          histogramCaches.current.set(testId, { etag: result.etag, data: result.data });
          return result.data;
        },
        refetchInterval: QUERY_POLL_INTERVAL_MS,
        retry: 1,
      },
    ],
  });

  const notFound = aggregateQuery.data === null || histogramQuery.data === null;
  const isError = aggregateQuery.isError || histogramQuery.isError;

  useEffect(() => {
    const fingerprint =
      aggregateQuery.data && histogramQuery.data
        ? fingerprintTestDetail(aggregateQuery.data, histogramQuery.data.bins)
        : null;
    setSession((prev) =>
      applyDetailPollTransition(prev, {
        testId,
        isError,
        fingerprint,
        studentCount: aggregateQuery.data?.count ?? 0,
        at: new Date().toISOString(),
      }),
    );
  }, [
    testId,
    aggregateQuery.data,
    histogramQuery.data,
    isError,
    aggregateQuery.dataUpdatedAt,
    histogramQuery.dataUpdatedAt,
  ]);

  return (
    <TestDetailPage
      testId={testId}
      aggregate={aggregateQuery.data ?? null}
      bins={histogramQuery.data?.bins ?? []}
      lastRefreshedAt={session.refresh.lastRefreshedAt}
      stale={session.refresh.phase === "stale"}
      announcement={session.refresh.announcement}
      notFound={notFound}
      error={isError && aggregateQuery.data == null ? "Unable to load test details." : null}
      onRetry={() => {
        void aggregateQuery.refetch();
        void histogramQuery.refetch();
      }}
    />
  );
}
