import { PercentDonut } from "./PercentDonut.tsx";

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

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 }).format(value)}%`;
}

type AggregateStatsProps = {
  aggregate: AggregateView;
};

const PERCENT_STATS: { label: string; key: keyof AggregateView; unit: "percent" }[] = [
  { label: "Mean", key: "mean", unit: "percent" },
  { label: "Min", key: "min", unit: "percent" },
  { label: "Max", key: "max", unit: "percent" },
  { label: "25th percentile", key: "p25", unit: "percent" },
  { label: "Median", key: "p50", unit: "percent" },
  { label: "75th percentile", key: "p75", unit: "percent" },
];

export function AggregateStats({ aggregate }: AggregateStatsProps) {
  const stdFormatted = formatPercent(aggregate.stddev);

  return (
    <div
      className="overflow-hidden rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)]"
      role="group"
      aria-label="Aggregate statistics"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-[var(--markr-border)] px-3 py-2.5 sm:px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-[var(--markr-fg-muted)]">Students</span>
          <span
            className="text-sm font-semibold tabular-nums sm:text-base"
            aria-label={`Students ${aggregate.count}`}
          >
            {aggregate.count}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm text-[var(--markr-fg-muted)]">Std. dev.</span>
          <span
            className="text-sm font-semibold tabular-nums sm:text-base"
            aria-label={`Std. dev. ${stdFormatted} percentage points`}
          >
            {stdFormatted}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[var(--markr-border)] sm:grid-cols-3">
        {PERCENT_STATS.map(({ label, key, unit }) => {
          const value = aggregate[key];
          const formatted = formatPercent(value);
          return (
            <div
              key={key}
              className="flex items-center gap-2.5 bg-[var(--markr-bg-elevated)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
            >
              <PercentDonut
                value={value}
                strokeWidth={4}
                className="size-8 shrink-0 sm:size-10"
              />
              <div className="min-w-0">
                <div className="truncate text-xs text-[var(--markr-fg-muted)] sm:text-sm">{label}</div>
                <div
                  className="text-sm font-semibold tabular-nums sm:text-base"
                  aria-label={`${label} ${formatted} ${unit}`}
                >
                  {formatted}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
