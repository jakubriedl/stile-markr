import { Alert } from "./Alert.tsx";

export type RefreshNoticeProps = {
  stale?: boolean;
  /** Polite live updates (list/detail changed, connection restored). Ignored while stale or errored. */
  announcement?: string | null;
  error?: string | null;
  onRetry?: (() => void) | undefined;
};

const STALE_MESSAGE =
  "Couldn't refresh right now. You're still seeing the last loaded results.";

function RetryAction({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="w-fit font-semibold text-[var(--markr-accent)] underline"
    >
      Retry
    </button>
  );
}

/**
 * Single status surface for load/refresh problems and polite live updates.
 * Hard error and stale each show one alert with Retry; never stacks with announcement.
 */
export function RefreshNotice({
  stale = false,
  announcement = null,
  error = null,
  onRetry,
}: RefreshNoticeProps) {
  if (error) {
    return (
      <Alert>
        <div className="flex flex-col gap-2">
          <span>{error}</span>
          {onRetry ? <RetryAction onRetry={onRetry} /> : null}
        </div>
      </Alert>
    );
  }

  if (stale) {
    return (
      <Alert tone="polite" variant="neutral">
        <div className="flex flex-col gap-2">
          <span>{STALE_MESSAGE}</span>
          {onRetry ? <RetryAction onRetry={onRetry} /> : null}
        </div>
      </Alert>
    );
  }

  if (announcement) {
    return (
      <Alert tone="polite" variant="neutral">
        {announcement}
      </Alert>
    );
  }

  return null;
}
