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

const numberFormatter = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 2 });

export function formatPercent(value: number): string {
  return `${numberFormatter.format(value)}%`;
}

/** Spoken percent without a `%` character (avoids VoiceOver saying “percent” twice). */
export function formatPercentSpoken(value: number): string {
  return `${numberFormatter.format(value)} percent`;
}

type AggregateStatsProps = {
  aggregate: AggregateView;
};

const PERCENT_STATS: { label: string; key: keyof AggregateView }[] = [
  { label: "Mean", key: "mean" },
  { label: "Min", key: "min" },
  { label: "Max", key: "max" },
  { label: "25th percentile", key: "p25" },
  { label: "Median", key: "p50" },
  { label: "75th percentile", key: "p75" },
];

export function AggregateStats({ aggregate }: AggregateStatsProps) {
  const stdFormatted = formatPercent(aggregate.stddev);
  const studentsLabel = `Students: ${aggregate.count}`;
  const stddevLabel = `Standard deviation: ${numberFormatter.format(aggregate.stddev)} percentage points`;

  return (
    <section
      className="overflow-hidden rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)]"
      aria-labelledby="aggregate-heading"
    >
      <h2
        id="aggregate-heading"
        className="m-0 border-b border-[var(--markr-border)] px-3 py-2.5 text-sm font-normal text-[var(--markr-fg-muted)] sm:px-4"
      >
        Aggregate statistics
      </h2>

      <ul className="m-0 flex list-none flex-wrap gap-x-6 gap-y-1 border-b border-[var(--markr-border)] px-3 py-2.5 sm:px-4">
        {/*
          Named role="img" inside the list item (not on <li>): one VO announcement,
          no “empty group” / duplicate name from aria-label + accessible text.
        */}
        <li className="flex">
          <span role="img" aria-label={studentsLabel} className="flex items-baseline gap-2">
            <span aria-hidden="true" className="text-sm text-[var(--markr-fg-muted)]">
              Students
            </span>
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums sm:text-base">
              {aggregate.count}
            </span>
          </span>
        </li>
        <li className="flex">
          <span role="img" aria-label={stddevLabel} className="flex items-baseline gap-2">
            <span aria-hidden="true" className="text-sm text-[var(--markr-fg-muted)]">
              Std. dev.
            </span>
            <span aria-hidden="true" className="text-sm font-semibold tabular-nums sm:text-base">
              {stdFormatted}
            </span>
          </span>
        </li>
      </ul>

      <ul className="m-0 grid list-none grid-cols-2 gap-px bg-[var(--markr-border)] p-0 sm:grid-cols-3">
        {PERCENT_STATS.map(({ label, key }) => {
          const value = aggregate[key];
          const formatted = formatPercent(value);
          const accessibleName = `${label}: ${formatPercentSpoken(value)}`;
          return (
            <li key={key} className="flex bg-[var(--markr-bg-elevated)]">
              <span
                role="img"
                aria-label={accessibleName}
                className="flex flex-1 items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
              >
                <PercentDonut
                  value={value}
                  strokeWidth={4}
                  className="size-8 shrink-0 sm:size-10"
                />
                <div aria-hidden="true" className="min-w-0">
                  <div className="truncate text-xs text-[var(--markr-fg-muted)] sm:text-sm">
                    {label}
                  </div>
                  <div className="text-sm font-semibold tabular-nums sm:text-base">{formatted}</div>
                </div>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
