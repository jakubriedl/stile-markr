import { SectionHeading } from "../../components/ui/Heading.tsx";

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
      className="m-0 flex flex-col gap-3 rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] p-4"
      aria-labelledby="histogram-heading"
    >
      <SectionHeading id="histogram-heading">Score histogram</SectionHeading>
      <ul className="m-0 flex list-none items-stretch gap-1.5 p-0 sm:gap-2">
        {bins.map((bin) => {
          const heightPct = (bin.count / maxBin) * 100;
          return (
            <li
              key={`${bin.lower_pct}-${bin.upper_pct}`}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex h-48 w-full flex-col items-center justify-end gap-1 border-b border-[var(--markr-border)] pb-0">
                <span
                  className="text-xs font-semibold tabular-nums text-[var(--markr-fg)]"
                  aria-label={`${bin.lower_pct} to ${bin.upper_pct} percent: ${bin.count} students`}
                >
                  {bin.count}
                </span>
                <div className="relative h-40 w-full max-w-11">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-sm bg-[var(--markr-accent)] motion-safe:transition-[height] motion-safe:duration-300"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: bin.count > 0 ? "0.2rem" : 0,
                    }}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <span className="mt-2 w-full text-center text-[0.65rem] leading-tight text-[var(--markr-fg-muted)] sm:text-xs">
                {bin.lower_pct}–{bin.upper_pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
