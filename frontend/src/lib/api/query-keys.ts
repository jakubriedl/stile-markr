export const queryKeys = {
  tests: ["tests"] as const,
  aggregate: (testId: string) => ["results", testId, "aggregate"] as const,
  histogram: (testId: string) => ["results", testId, "histogram"] as const,
};

/** Five-second polling keeps list/detail updates within the ten-second UX budget. */
export const QUERY_POLL_INTERVAL_MS = 5_000;
