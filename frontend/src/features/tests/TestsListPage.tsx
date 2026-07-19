import { PageHeading } from "../../components/ui/Heading.tsx";
import { Link } from "../../components/ui/Link.tsx";
import { FullscreenButton } from "../../components/ui/FullscreenButton.tsx";
import { RefreshNotice } from "../../components/ui/RefreshNotice.tsx";
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

const rowGridClass =
  "grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-4 px-3 sm:gap-x-6 sm:px-4";

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

      <RefreshNotice
        stale={stale}
        announcement={announcement}
        error={error}
        onRetry={onRetry}
      />

      {error ? null : tests.length === 0 ? (
        <div className="rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)] px-4 py-8 text-center">
          <p className="m-0 text-[var(--markr-fg-muted)]">No tests imported yet.</p>
          <p className="mt-2 mb-0">
            <Link href={uploadHref}>Upload exam results</Link>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--markr-radius)] border border-[var(--markr-border)] bg-[var(--markr-bg-elevated)]">
          <div
            aria-hidden="true"
            className={`${rowGridClass} border-b border-[var(--markr-border)] py-2.5 text-sm font-normal text-[var(--markr-fg-muted)]`}
          >
            <span>Test ID</span>
            <span className="min-w-16 text-right sm:min-w-20">Students</span>
            <span className="min-w-24 text-right sm:min-w-28">Marks available</span>
            <span className="size-4" />
          </div>
          <ul aria-label="Imported tests" className="m-0 list-none p-0">
            {tests.map((test) => {
              const href = `/tests/${encodeURIComponent(test.test_id)}`;
              const accessibleName = `Test ${test.test_id}, ${test.student_count} students, ${test.marks_available} marks available`;
              return (
                <li
                  key={test.test_id}
                  className="group relative border-b border-[var(--markr-border)] transition-colors last:border-b-0 hover:bg-[var(--markr-bg)] focus-within:bg-[var(--markr-bg)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--markr-focus)]"
                >
                  {/*
                    Stretched link: ::after covers the row so the whole item is clickable
                    while keeping one real link for AT.
                  */}
                  <Link
                    href={href}
                    aria-label={accessibleName}
                    className="block py-3 text-[var(--markr-fg)] no-underline outline-none after:absolute after:inset-0 after:content-[''] group-hover:text-[var(--markr-accent)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  >
                    <span aria-hidden="true" className={rowGridClass}>
                      <span className="min-w-0 truncate font-semibold">{test.test_id}</span>
                      <span className="min-w-16 text-right text-sm tabular-nums sm:min-w-20 sm:text-base">
                        {test.student_count}
                      </span>
                      <span className="min-w-24 text-right text-sm tabular-nums sm:min-w-28 sm:text-base">
                        {test.marks_available}
                      </span>
                      <span className="text-[var(--markr-fg-muted)] group-hover:text-[var(--markr-accent)]">
                        <RowChevron />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </main>
  );
}
