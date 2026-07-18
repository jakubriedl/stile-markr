import { Alert } from "../../components/ui/Alert.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { formatLastRefreshedUtc } from "../../lib/live-state/displayed-snapshots.ts";

export type TestListItemView = {
  test_id: string;
  student_count: number;
  marks_available: number;
};

export type TestsListPageProps = {
  tests: TestListItemView[];
  lastRefreshedAt: string | null;
  stale?: boolean;
  announcement?: string | null;
  error?: string | null;
  onRetry?: () => void;
  uploadHref?: string;
};

export function TestsListPage({
  tests,
  lastRefreshedAt,
  stale = false,
  announcement = null,
  error = null,
  onRetry,
  uploadHref = "/",
}: TestsListPageProps) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-[family-name:var(--markr-font-display)] text-3xl">Tests</h1>
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

      {tests.length === 0 && error == null ? (
        <p className="m-0">
          No tests imported yet. <Link href={uploadHref}>Upload exam results</Link>
        </p>
      ) : (
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Imported tests</caption>
          <thead>
            <tr className="border-b border-[var(--markr-border)]">
              <th scope="col" className="py-2">
                Test ID
              </th>
              <th scope="col" className="py-2">
                Students
              </th>
              <th scope="col" className="py-2">
                Marks available
              </th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.test_id} className="border-b border-[var(--markr-border)]">
                <td className="py-2">
                  <Link href={`/tests/${encodeURIComponent(test.test_id)}`}>{test.test_id}</Link>
                </td>
                <td className="py-2">{test.student_count}</td>
                <td className="py-2">{test.marks_available}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
