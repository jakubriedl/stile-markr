# Plan

The task brief is available in [`task/README.md`](task/README.md).

## Todo

- [x] Initialize the repository documentation.
- [x] Clarify all requirements.
- [x] Design the architecture.
- [x] Scaffold the pnpm/Turborepo workspace and pass the runtime compatibility gate.
  - Add all root manifests, tool pins, Oxc/TypeScript/Turbo configuration, package dependencies, and the lockfile.
  - Scaffold side-effect-free Hono app types and thin TanStack Start routes without feature behavior.
  - Prove Bun SSR/proxy, Hono/Drizzle, real-process Vitest, evlog, and OpenTelemetry propagation; switch both services to Node LTS and `node:sqlite` if any hard gate fails.
  - Run the initial React Doctor audit and project-local install after the frontend scaffold.
- [ ] Implement backend persistence and streamed imports in an isolated parallel lane.
  - Own SQLite schema definitions and migration requirements, import worker/protocol, `saxes` state machine, Zod normalization, bounded queue/body handling, transactional upserts, and import tests.
  - Hand migration generation/application changes to the integrator as a serial follow-up.
- [ ] Implement backend reporting and operations in an isolated parallel lane.
  - Own aggregate/test-list/histogram SQL, ETags, health, errors, evlog/OpenTelemetry, lifecycle, and unit/integration tests.
- [ ] Implement the frontend design system and Storybook in an isolated parallel lane.
  - Own React Aria/Tailwind primitives, page screens, semantic histogram, all stories/states, Storybook Vitest interactions, axe, themes, and component coverage.
- [ ] Implement frontend data and route integration in an isolated parallel lane.
  - Own TanStack Query SSR/hydration, Hono RPC client, streaming `/api` proxy, MSW handlers, route loaders/boundaries, polling/ETags, and announcement/stale-state tests.
- [ ] Integrate the validated feature lanes.
  - Cherry-pick reviewed commits, wire backend/frontend entrypoints and generated routes, apply dependency requests centrally, resolve contracts, and rerun complete adversarial review after conflicts.
- [ ] Add Docker, CI, and quality automation.
  - Add non-root multi-stage images, migration/backend/frontend Compose ordering, persistent SQLite, optional Collector profile, GitHub Actions, Storybook/coverage artifacts, and Compose/API smoke checks.
- [ ] Complete full acceptance and submission documentation.
  - Run Oxc, typechecking, coverage, backend integration, Storybook, production builds, React Doctor, Docker/Compose smoke, adversarial review, and destructive built-in-browser E2E.
  - Complete the manual Safari/VoiceOver checklist and finalize README assumptions, approach, highlights, run instructions, performance notes, and required joke phrase.

## Implementation wave checklist

### Wave 2 — reviewed feature tracks

- [ ] Land canonical result normalization, Zod boundaries, and Drizzle schema definitions in one reviewed backend-domain commit.
- [ ] Generate, apply, and inspect the initial SQLite migration in a separate integrator commit.
- [ ] Land reviewed backend-import commits for streamed XML validation, bounded worker admission, transactional maxima/upserts, and the import HTTP contract.
- [ ] Land reviewed backend-reporting commits for aggregates/histograms, list/ETag behavior, readiness/lifecycle, and privacy-safe telemetry.
- [ ] Land reviewed frontend-UI commits for tokens/primitives, upload/list/detail states, Storybook interactions, axe, themes, and reduced motion.
- [ ] Land reviewed frontend-data commits for the typed proxy/client, SSR hydration, polling/ETags, strict MSW handlers, and stale/recovery announcements.

### Wave 3 — serial integration

- [ ] Cherry-pick every validated lane commit without squashing and remove its temporary worktree/branch.
- [ ] Wire integrator-owned database/app/router composition and regenerate owned artifacts.
- [ ] Add cross-feature import-to-reporting, SSR/browser API, hydration, and live-state tests.
- [ ] Pass frozen install, validation, real-process integration, Storybook browser/static, React Doctor, production build, and full-diff review gates.

### Wave 4 — infrastructure and acceptance

- [ ] Add reviewed non-root images, migration/backend/frontend Compose ordering, persistence, and optional Collector configuration.
- [ ] Add reviewed least-privilege CI, quality/smoke jobs, and coverage/Storybook artifacts.
- [ ] Run clean-volume Compose smoke and authorized destructive browser acceptance.
- [ ] Complete manual Safari/VoiceOver checks, documentation, final adversarial review, and reviewer handoff.

<!-- Extend this list with implementation and other todo items as they are discovered. -->

## Agent execution rules

- GPT-5.6 Sol Extra High orchestrates, integrates, resolves conflicts, and performs every adversarial review.
- GPT-5.6 Terra Medium implements focused lanes and escalates only after a blocker or repeated failed review.
- Parallel lanes use temporary `agent/<wave>/<lane>` branches in isolated worktrees with exclusive paths.
- Only the integrator edits root manifests, `pnpm-lock.yaml`, migrations, generated entrypoints/route trees, Compose, and workflows. Feature agents request dependencies.
- Each implementation commit includes tests and must pass its lane checks plus a fresh `markr-adversarial-review`.
- Fixes receive a complete re-review. Validated commits are cherry-picked into `main`, then temporary worktrees and branches are removed.
