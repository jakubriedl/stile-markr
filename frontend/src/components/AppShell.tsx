import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navInactive =
  "rounded-[var(--markr-radius)] px-3 py-1.5 text-sm font-semibold text-[var(--markr-fg-muted)] no-underline outline-none transition-colors hover:bg-[var(--markr-bg-elevated)] hover:text-[var(--markr-fg)] focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)]";

const navActive =
  "rounded-[var(--markr-radius)] bg-[var(--markr-bg-elevated)] px-3 py-1.5 text-sm font-semibold text-[var(--markr-fg)] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--markr-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--markr-bg)]";

export type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-full bg-[var(--markr-bg)] text-[var(--markr-fg)]">
      <header className="border-b border-[var(--markr-border)] bg-[var(--markr-bg)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-6 px-4 py-3">
          <span className="font-[family-name:var(--markr-font-display)] text-lg font-semibold tracking-tight text-[var(--markr-fg)]">
            Markr
          </span>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              inactiveProps={{ className: navInactive }}
              activeProps={{ className: navActive, "aria-current": "page" }}
            >
              Upload
            </Link>
            <Link
              to="/tests"
              inactiveProps={{ className: navInactive }}
              activeProps={{ className: navActive, "aria-current": "page" }}
            >
              Tests
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
    </div>
  );
}
