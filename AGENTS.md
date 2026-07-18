# Agent Guide

## Repository status

This is a greenfield repository with clarified requirements and a designed architecture. Application implementation has not started.

## Repository map

- `PLAN.md` is the evolving plan and todo list.
- `REQUIREMENTS.md` is the product-requirements and acceptance-criteria source of truth.
- `ARCHITECTURE.md` is the implementation-architecture source of truth.
- `NOTES.md` records development considerations and context.
- `README.md` is the human-facing project overview.
- `AGENTS.md` contains instructions for agents.
- `.agents/skills/` contains reviewed third-party project guidance.
- `.cursor/skills/` contains Markr-specific stack, review, and browser workflows.
- `task/` contains the task brief and supporting materials.

## Working guidance

- Treat `task/` as source material and do not modify it.
- Use `REQUIREMENTS.md` as the source of truth for product behavior.
- Use `ARCHITECTURE.md` as the source of truth for implementation boundaries and technology decisions.
- Use `PLAN.md` as the source of truth for planned work and ordering.
- Read and follow the `markr-stack` skill before implementation work.
- Use Context7 and the installed project skills for current library guidance; repository requirements and architecture win on conflict.
- Add newly discovered work to the todo list in `PLAN.md`.
- Record useful observations and trade-offs in `NOTES.md`.
- Keep explicit requirements separate from assumptions when requirements are clarified.
- Reference the relevant note when a clarified decision changes `REQUIREMENTS.md`.
- After implementing and validating each significant part of the work, create a descriptive commit that clearly summarizes the completed change.

## Parallel implementation

- GPT-5.6 Sol Extra High orchestrates, integrates, resolves conflicts, and performs adversarial reviews.
- GPT-5.6 Terra Medium handles narrow implementation lanes.
- Parallel agents use temporary `agent/<wave>/<lane>` branches in isolated worktrees with explicit writable paths.
- Only the integrator edits root manifests, `pnpm-lock.yaml`, migrations, generated entrypoints/route trees, Docker Compose, and workflows.
- Feature agents request dependencies instead of editing manifests or the lockfile.
- Run the read-only `markr-adversarial-review` skill after every implementation run and after fixes.
- Block integration on requirement mismatches, failed checks, critical/high findings, or unresolved medium findings without recorded accepted debt.
- Cherry-pick validated focused commits into `main`, then remove temporary worktrees and branches.

## Quality guidance

- Use ESM-only strict TypeScript, pnpm, Turborepo, Oxfmt, and Oxlint as documented in `ARCHITECTURE.md`.
- Add tests with implementation. Critical import/domain logic targets 90% branch coverage; overall tested code targets 80%.
- Keep XML, names, student numbers, and request bodies out of logs, spans, metrics, snapshots, and errors.
- Run React Doctor after frontend changes once the foundation task installs it.
- Use `markr-browser-e2e` only when destructive full-stack acceptance is explicitly requested; it deletes the normal Compose volume.

## Validation commands

- Narrow package checks: `pnpm --filter @markr/backend test`, `pnpm --filter @markr/frontend test`, and the corresponding `typecheck` script.
- Real-process checks: `pnpm test:integration`.
- Frontend review: `pnpm react:doctor` for the full tree, `pnpm react:doctor:changed` for an incremental check, `pnpm test:storybook`, `pnpm storybook:build`, and `pnpm --filter @markr/frontend build`.
- Full local gate: `pnpm validate`, followed by `pnpm test:integration` and the Storybook build.
- CI installs with `pnpm install --frozen-lockfile`.
