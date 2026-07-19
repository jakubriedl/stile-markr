import { Alert } from "../../components/ui/Alert.tsx";
import { PageHeading } from "../../components/ui/Heading.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { FullscreenButton } from "../../components/ui/FullscreenButton.tsx";
import { RefreshStatusTag } from "../../components/ui/RefreshStatusTag.tsx";

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

function RowChevron() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    <main className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <PageHeading>Tests</PageHeading>
        <div className="flex items-center gap-1">
          <RefreshStatusTag
            lastRefreshedAt={lastRefreshedAt}
            stale={stale}
            settled={lastRefreshedAt != null || stale || error != null}
          />
          <FullscreenButton />
        </div>
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
        <div className="rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-4 py-8 text-center">
          <p className="m-0 text-[var(--markr-fg-muted)]">No tests imported yet.</p>
          <p className="mt-2 mb-0">
            <Link href={uploadHref}>Upload exam results</Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)]">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Imported tests</caption>
            <thead>
              <tr className="border-b border-[var(--markr-border)]">
                <th
                  scope="col"
                  className="px-3 py-2.5 text-sm font-normal text-[var(--markr-fg-muted)] sm:px-4"
                >
                  Test ID
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-sm font-normal text-[var(--markr-fg-muted)] sm:px-4"
                >
                  Students
                </th>
                <th
                  scope="col"
                  className="px-3 py-2.5 text-sm font-normal text-[var(--markr-fg-muted)] sm:px-4"
                >
                  Marks available
                </th>
                <th scope="col" className="w-10 px-3 py-2.5 sm:px-4">
                  <span className="sr-only">Open test</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const href = `/tests/${encodeURIComponent(test.test_id)}`;
                return (
                  <tr
                    key={test.test_id}
                    className="group relative border-b border-[var(--markr-border)] transition-colors last:border-b-0 hover:bg-[var(--markr-bg)] focus-within:bg-[var(--markr-bg)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--markr-focus)]"
                  >
                    <td className="px-3 py-3 sm:px-4">
                      {/*
                        Stretched link: ::after covers the row (tr is position:relative)
                        so the whole row is clickable while keeping one real <a> for AT.
                      */}
                      <Link
                        href={href}
                        className="font-semibold text-[var(--markr-fg)] no-underline outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--markr-accent)] focus-visible:ring-0 focus-visible:ring-offset-0"
                      >
                        {test.test_id}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums sm:px-4 sm:text-base">
                      {test.student_count}
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums sm:px-4 sm:text-base">
                      {test.marks_available}
                    </td>
                    <td
                      className="px-3 py-3 text-[var(--markr-fg-muted)] group-hover:text-[var(--markr-accent)] sm:px-4"
                      aria-hidden="true"
                    >
                      <RowChevron />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
