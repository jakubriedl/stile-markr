import type { CSSProperties } from "react";

const pulse = "bg-[var(--markr-border)] motion-safe:animate-pulse";

function Bone({ className, style }: { className: string; style?: CSSProperties }) {
  return <div className={`${pulse} ${className}`} style={style} aria-hidden="true" />;
}

const PERCENT_TILES = 6;
const HISTOGRAM_BARS = 10;
/** Placeholder heights so the chart silhouette feels like a real histogram. */
const BAR_HEIGHTS = ["30%", "45%", "20%", "55%", "70%", "85%", "60%", "40%", "25%", "35%"];

export function AggregateStatsSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)]"
      aria-hidden="true"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-[var(--markr-border)] px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Bone className="h-3.5 w-16 rounded-sm" />
          <Bone className="h-4 w-8 rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <Bone className="h-3.5 w-14 rounded-sm" />
          <Bone className="h-4 w-12 rounded-sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-[var(--markr-border)] sm:grid-cols-3">
        {Array.from({ length: PERCENT_TILES }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-2.5 bg-[var(--markr-bg-elevated)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3"
          >
            <Bone className="size-8 shrink-0 rounded-full sm:size-10" />
            <div className="flex min-w-0 flex-col gap-1.5">
              <Bone className="h-3 w-16 rounded-sm sm:w-20" />
              <Bone className="h-4 w-10 rounded-sm sm:h-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreHistogramSkeleton() {
  return (
    <div
      className="flex flex-col gap-0 rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] p-4"
      aria-hidden="true"
    >
      <Bone className="mb-3 h-3.5 w-28 rounded-sm" />
      <ul className="m-0 flex list-none items-stretch gap-1.5 p-0 sm:gap-2">
        {Array.from({ length: HISTOGRAM_BARS }, (_, index) => (
          <li key={index} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex h-48 w-full flex-col items-center justify-end border-b border-[var(--markr-border)]">
              <Bone className="mb-1 h-3 w-4 rounded-sm" />
              <Bone
                className="w-full max-w-11 rounded-t-sm"
                style={{ height: BAR_HEIGHTS[index] }}
              />
            </div>
            <Bone className="mt-2 h-3 w-full max-w-12 rounded-sm" />
          </li>
        ))}
      </ul>
    </div>
  );
}
