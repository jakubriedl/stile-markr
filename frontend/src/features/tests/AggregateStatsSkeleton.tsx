const pulse = "bg-[var(--markr-border)] motion-safe:animate-pulse";

function Bone({ className }: { className: string }) {
  return <div className={`${pulse} ${className}`} aria-hidden="true" />;
}

const PERCENT_TILES = 6;

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
