import { Alert } from "../../components/ui/Alert.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { formatLastRefreshedUtc } from "../../lib/live-state/displayed-snapshots.ts";

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
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
        <h1 className="m-0 font-[family-name:var(--markr-font-display)] text-3xl">Test {testId}</h1>
        <p className="m-0">This test was not found.</p>
        <Link href={testsHref}>Back to tests</Link>
      </main>
    );
  }

  const maxBin = Math.max(1, ...bins.map((bin) => bin.count));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-[family-name:var(--markr-font-display)] text-3xl">Test {testId}</h1>
        <p className="m-0 text-sm text-[var(--markr-fg-muted)]">
          Last refreshed: {formatLastRefreshedUtc(lastRefreshedAt)}
          {stale ? " (stale)" : ""}
        </p>
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
          <h2 id="aggregate-heading" className="m-0 text-xl">
            Aggregate statistics
          </h2>
          <dl className="grid grid-cols-2 gap-3 m-0 sm:grid-cols-4">
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

      <figure className="m-0 flex flex-col gap-3" aria-labelledby="histogram-heading">
        <figcaption id="histogram-heading" className="text-xl font-semibold">
          Score histogram
        </figcaption>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {bins.map((bin) => (
            <li
              key={`${bin.lower_pct}-${bin.upper_pct}`}
              className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3"
            >
              <span>
                {bin.lower_pct}–{bin.upper_pct}%
              </span>
              <div
                className="h-4 rounded-sm bg-[var(--markr-accent)]"
                style={{ width: `${(bin.count / maxBin) * 100}%` }}
                aria-hidden="true"
              />
              <span
                aria-label={`${bin.lower_pct} to ${bin.upper_pct} percent: ${bin.count} students`}
              >
                {bin.count}
              </span>
            </li>
          ))}
        </ul>
      </figure>

      <p className="m-0">
        <Link href={testsHref}>Back to tests</Link>
      </p>
    </main>
  );
}
