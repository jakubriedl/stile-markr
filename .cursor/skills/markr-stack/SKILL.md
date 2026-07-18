---
name: markr-stack
description: Aligns Markr implementation work with repository requirements, architecture, current library documentation, file ownership, testing, and privacy constraints. Use before creating or changing Markr application, infrastructure, tests, or configuration.
---

# Markr Stack Alignment

## Before editing

1. Read `REQUIREMENTS.md`, the relevant sections of `ARCHITECTURE.md`, and linked `NOTE-ARCH-*`/`NOTE-REQ-*` entries.
2. Read `PLAN.md` and `AGENTS.md`.
3. Confirm the assigned goal, requirement IDs, writable paths, forbidden paths, validation commands, and commit boundary.
4. If working in a parallel lane, verify the current worktree/branch and do not edit:
   - root manifests or `pnpm-lock.yaml`;
   - migrations;
   - app/router composition or generated route trees;
   - files owned by another lane.
5. Request dependencies from the integrator. Do not add them in a feature lane.

## Use current guidance

- Use Context7 before relying on APIs from TanStack Start/Query, Hono, Drizzle, Storybook, MSW, React Aria, Tailwind, Vitest, OpenTelemetry, Bun, or evlog.
- Read the relevant project-local skills under `.agents/skills/`.
- Treat `tanstack-start-best-practices` as advisory; repository architecture and current official docs take precedence.
- React Aria examples may use npm/Jest. This repository uses pnpm and Vitest.

## Architectural constraints

- Keep TanStack route files and Hono route handlers thin.
- Preserve the Hono RPC contract and side-effect-free `createApp` boundary.
- Browser API calls use same-origin `/api`; SSR calls the backend internally.
- Do not buffer import XML or log request bodies/student data.
- Preserve one active/four queued imports, worker backpressure, transactional rollback, and SQLite single-writer behavior.
- Keep SQLite-specific SQL explicit and mark PostgreSQL divergences narrowly.
- Emit bounded-cardinality telemetry with no XML, names, student numbers, or raw test IDs.
- Keep page components independently renderable in Storybook with MSW-backed states.
- Use semantic HTML, React Aria where it adds behavior, visible focus, reduced motion, and WCAG 2.2 AA.

## Implementation loop

1. Add or update tests with the implementation.
2. Run the narrowest relevant checks continuously.
3. Before handoff, run every assigned validation command, Oxc/type checks, and affected tests.
4. Run React Doctor after frontend changes once it is installed.
5. Review the diff for requirement coverage, ownership, PII, generated files, and unrelated edits.
6. Commit one independently testable concern with a descriptive message.

Focused implementation lanes use GPT-5.6 Terra Medium. Do not broaden scope; report blockers to the GPT-5.6 Sol Extra High orchestrator.
