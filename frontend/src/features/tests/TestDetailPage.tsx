import { Alert } from "../../components/ui/Alert.tsx";
import { PageHeading } from "../../components/ui/Heading.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { FullscreenButton } from "../../components/ui/FullscreenButton.tsx";
import { RefreshStatusTag } from "../../components/ui/RefreshStatusTag.tsx";
import { AggregateStats, type AggregateView } from "./AggregateStats.tsx";
import { ScoreHistogram } from "./ScoreHistogram.tsx";
import { AggregateStatsSkeleton } from "./AggregateStatsSkeleton.tsx";
import { ScoreHistogramSkeleton } from "./ScoreHistogramSkeleton.tsx";

export type { AggregateView };

export type HistogramBinView = {
  lower_pct: number;
  upper_pct: number;
  count: number;
};

export type TestDetailPageProps = {
  testId: string;
  aggregate: AggregateView | null;
  bins: HistogramBinView[];
  lastRefreshedAt: string | null;
  stale?: boolean;
  announcement?: string | null;
  notFound?: boolean;
  error?: string | null;
  loading?: boolean;
  onRetry?: () => void;
  testsHref?: string;
};

export function TestDetailPage({
  testId,
  aggregate,
  bins,
  lastRefreshedAt,
  stale = false,
  announcement = null,
  notFound = false,
  error = null,
  loading = false,
  onRetry,
  testsHref = "/tests",
}: TestDetailPageProps) {
  if (notFound) {
    return (
      <main className="flex flex-col gap-4">
        <PageHeading>Test {testId}</PageHeading>
        <p className="m-0">This test was not found.</p>
        <Link href={testsHref}>Back to tests</Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-6" aria-busy={loading || undefined}>
      <header className="flex items-start justify-between gap-4">
        <PageHeading>Test {testId}</PageHeading>
        <div className="flex items-center gap-1">
          <RefreshStatusTag
            lastRefreshedAt={lastRefreshedAt}
            stale={stale}
            settled={lastRefreshedAt != null || stale || error != null}
          />
          <FullscreenButton />
        </div>
      </header>

      {announcement ? (
        <Alert tone="polite" variant="neutral">
          {announcement}
        </Alert>
      ) : null}

      {error ? (
        <Alert>
          <div className="flex flex-col gap-2">
            <span>{error}</span>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="w-fit font-semibold text-[var(--markr-accent)] underline"
              >
                Retry
              </button>
            ) : null}
          </div>
        </Alert>
      ) : null}

      {loading ? (
        <>
          <AggregateStatsSkeleton />
          <ScoreHistogramSkeleton />
        </>
      ) : (
        <>
          {aggregate ? <AggregateStats aggregate={aggregate} /> : null}
          <ScoreHistogram bins={bins} />
        </>
      )}
    </main>
  );
}
