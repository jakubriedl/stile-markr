export type ScoreHistogramBin = {
  lower_pct: number;
  upper_pct: number;
  count: number;
};

export type ScoreHistogramProps = {
  bins: ScoreHistogramBin[];
};

export function ScoreHistogram({ bins }: ScoreHistogramProps) {
  const maxBin = Math.max(1, ...bins.map((bin) => bin.count));

  return (
    <figure
      className="m-0 flex flex-col gap-0 rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] p-4"
      aria-labelledby="histogram-heading"
    >
      <h2
        id="histogram-heading"
        className="m-0 text-sm font-normal text-[var(--markr-fg-muted)]"
      >
        Score histogram
      </h2>
      <ul className="m-0 flex list-none items-stretch gap-1.5 p-0 sm:gap-2">
        {bins.map((bin) => {
          const heightPct = (bin.count / maxBin) * 100;
          const accessibleName = `${bin.lower_pct} to ${bin.upper_pct} percent: ${bin.count} students`;
          return (
            <li
              key={`${bin.lower_pct}-${bin.upper_pct}`}
              aria-label={accessibleName}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                aria-hidden="true"
                className="flex h-48 w-full flex-col items-center justify-end border-b border-[var(--markr-border)]"
              >
                <span className="mb-1 shrink-0 text-xs font-semibold tabular-nums text-[var(--markr-fg)]">
                  {bin.count}
                </span>
                <div
                  className="w-full max-w-11 shrink-0 rounded-t-sm bg-[var(--markr-accent)] motion-safe:transition-[height] motion-safe:duration-300"
                  style={{
                    height:
                      bin.count > 0 ? `max(0.2rem, calc(10rem * ${heightPct} / 100))` : 0,
                  }}
                />
              </div>
              <span
                aria-hidden="true"
                className="mt-2 w-full text-center text-[0.65rem] leading-tight text-[var(--markr-fg-muted)] sm:text-xs"
              >
                {bin.lower_pct}–{bin.upper_pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
