import { formatLastRefreshed } from "../../lib/live-state/displayed-snapshots.ts";

export type RefreshStatusTagProps = {
  lastRefreshedAt: string | null;
  stale?: boolean;
  /**
   * When false, the tag is hidden (initial loading before first success/failure).
   * Set true after the first poll settles.
   */
  settled?: boolean;
  /** Keeps the visual tooltip open (used in tests). */
  defaultOpen?: boolean;
};

export function RefreshStatusTag({
  lastRefreshedAt,
  stale = false,
  settled = false,
  defaultOpen = false,
}: RefreshStatusTagProps) {
  if (!settled) {
    return null;
  }

  const isLive = !stale && lastRefreshedAt != null;
  const label = isLive ? "Live" : "Reconnecting";
  const tooltip = `Last refreshed: ${formatLastRefreshed(lastRefreshedAt)}`;
  // Name includes last-refreshed so AT always hears it. role="img" (not button/status)
  // avoids “button” chrome and live-region announcements (DETAIL-009).
  const accessibleName = `${label}. ${tooltip}`;

  return (
    <span
      role="img"
      tabIndex={0}
      aria-label={accessibleName}
      className={[
        "group relative inline-flex shrink-0 cursor-default items-center gap-2 rounded-full border px-3 py-1 font-[family-name:var(--markr-font-sans)] text-sm font-semibold outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)]",
        isLive
          ? "border-[var(--markr-success)] bg-[var(--markr-success-bg)] text-[var(--markr-success)]"
          : "border-[var(--markr-warning)] bg-[var(--markr-warning-bg)] text-[var(--markr-warning)]",
      ].join(" ")}
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
      <span aria-hidden="true">{label}</span>
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-max max-w-xs -translate-x-1/2 rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-3 py-2 text-sm font-normal text-[var(--markr-fg)] shadow-md transition-opacity",
          defaultOpen
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100",
        ].join(" ")}
      >
        {tooltip}
      </span>
    </span>
  );
}
