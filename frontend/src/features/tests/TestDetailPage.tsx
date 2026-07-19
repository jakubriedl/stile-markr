import { Alert } from "../../components/ui/Alert.tsx";
import { PageHeading, SectionHeading } from "../../components/ui/Heading.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { RefreshStatusTag } from "../../components/ui/RefreshStatusTag.tsx";
import { ScoreHistogram } from "./ScoreHistogram.tsx";

export type AggregateView = {
  mean: number;
  stddev: number;
  min: number;
  max: number;
  p25: number;
  p50: number;
  p75: number;
  count: number;
};

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
  onRetry?: () => void;
  testsHref?: string;
};

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function TestDetailPage({
  testId,
  aggregate,
  bins,
  lastRefreshedAt,
  stale = false,
  announcement = null,
  notFound = false,
  error = null,
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
    <main className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <PageHeading>Test {testId}</PageHeading>
        <RefreshStatusTag
          lastRefreshedAt={lastRefreshedAt}
          stale={stale}
          settled={lastRefreshedAt != null || stale || error != null}
        />
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

      {aggregate ? (
        <section aria-labelledby="aggregate-heading" className="flex flex-col gap-3">
          <SectionHeading id="aggregate-heading">Aggregate statistics</SectionHeading>
          <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["Students", String(aggregate.count), ""],
                ["Mean", formatPercent(aggregate.mean), "percent"],
                ["Std. dev.", formatPercent(aggregate.stddev), "percentage points"],
                ["Min", formatPercent(aggregate.min), "percent"],
                ["Max", formatPercent(aggregate.max), "percent"],
                ["25th percentile", formatPercent(aggregate.p25), "percent"],
                ["Median", formatPercent(aggregate.p50), "percent"],
                ["75th percentile", formatPercent(aggregate.p75), "percent"],
              ] as const
            ).map(([label, value, unit]) => (
              <div
                key={label}
                className="rounded-[var(--markr-radius)] bg-[var(--markr-bg-elevated)] p-3"
              >
                <dt className="m-0 text-sm text-[var(--markr-fg-muted)]">{label}</dt>
                <dd className="m-0 text-lg font-semibold">
                  <span aria-label={unit ? `${label} ${value} ${unit}` : `${label} ${value}`}>
                    {value}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <ScoreHistogram bins={bins} />
    </main>
  );
}
