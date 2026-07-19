import { Tooltip, TooltipTrigger } from "react-aria-components";

import { formatLastRefreshedUtc } from "../../lib/live-state/displayed-snapshots.ts";

export type RefreshStatusTagProps = {
  lastRefreshedAt: string | null;
  stale?: boolean;
  /** Opens the tooltip on mount (used in tests). */
  defaultOpen?: boolean;
};

export function RefreshStatusTag({
  lastRefreshedAt,
  stale = false,
  defaultOpen = false,
}: RefreshStatusTagProps) {
  const isLive = !stale && lastRefreshedAt != null;
  const label = isLive ? "Live" : "Reconnecting";
  const tooltip = `Last refreshed: ${formatLastRefreshedUtc(lastRefreshedAt)}`;

  return (
    <TooltipTrigger delay={200} closeDelay={100} defaultOpen={defaultOpen}>
      <button
        type="button"
        className={[
          "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 font-[family-name:var(--markr-font-sans)] text-sm font-semibold outline-none",
          "focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)]",
          isLive
            ? "border-[var(--markr-success)] bg-[var(--markr-success-bg)] text-[var(--markr-success)]"
            : "border-[var(--markr-warning)] bg-[var(--markr-warning-bg)] text-[var(--markr-warning)]",
        ].join(" ")}
        aria-label={`${label}. ${tooltip}`}
      >
        <span
          className={[
            "size-2 shrink-0 rounded-full",
            isLive
              ? "bg-[var(--markr-success)] motion-safe:animate-pulse"
              : "bg-[var(--markr-warning)]",
          ].join(" ")}
          aria-hidden="true"
        />
        {label}
      </button>
      <Tooltip
        offset={8}
        className="max-w-xs rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-3 py-2 text-sm text-[var(--markr-fg)] shadow-md outline-none"
      >
        {tooltip}
      </Tooltip>
    </TooltipTrigger>
  );
}
