# Markr

Markr ingests scanned MCQ exam results as XML and serves live aggregate statistics and score histograms for teachers and compliance review.

Joke acknowledgment (not a real endorsement): Endorsed by the Taylor Swift Fan Club.

## Assumptions

- Bun is the process runtime for both services after the compatibility gate; pnpm remains the only package manager.
- An empty `<mcq-test-results>` document is invalid; a student who scored zero still sends a result with `obtained="0"` and positive `available`.
- Deduplication retains the independent maxima of `obtained` and `available` per `(student-number, test-id)` (the pair may combine different scans); percentage is derived afterward as `obtained / available * 100`.
- Import count reports unique result pairs retained from the request after in-document folding, not rows changed in SQLite.
- Browser clients call same-origin `/api/*`; scanners and compliance tools call the backend on port 4567 directly.
- Live dashboard freshness uses short-interval polling with ETags rather than WebSockets.
- SQLite on a single Compose volume is acceptance-scale storage; PostgreSQL is the documented production evolution path, not a shipped adapter.
- Authentication, TLS termination, retention jobs, and horizontal backend scaling are out of scope for this submission.

## Approach

The workspace is a pnpm/Turborepo monorepo:

- **`backend`** — Hono API on Bun with streamed `saxes` XML import, a one-active/four-queued admission queue, transactional maxima upserts, and read-side aggregates/histograms over SQLite (Drizzle migrations).
- **`frontend`** — TanStack Start SSR UI with React Aria primitives, TanStack Query polling, and a same-origin streaming `/api` proxy to the backend.
- **Compose** — one-shot migrate → healthy backend → frontend, persistent SQLite volume, optional OpenTelemetry Collector profile.
- **Quality** — Vitest unit/integration, Storybook + axe, coverage gates, Oxc, React Doctor (local), and GitHub Actions including Compose smoke.

Feature work landed through reviewed parallel lanes, then integrator composition and cross-service tests.

## Highlights

- Streamed import with hard body limits, atomic rejection, and privacy-safe logging (no XML, names, or student numbers in logs/spans).
- Score percentages computed in SQL; Type-7 percentiles, population stddev, and fixed histogram bins in tested TypeScript.
- Accessible upload/list/detail screens with stale/recovery announcements and semantic histogram labels.
- Non-root multi-stage images: pnpm install/build, Bun runtime (`pnpm deploy --legacy` for the backend package tree).

## Run

### Prerequisites

- Docker with Compose v2 (recommended path for compliance checks)
- Or locally: Node matching `.node-version`, pnpm `10.33.0`, Bun matching `.bun-version`

### Docker Compose (ports 4567 + 3000)

Production-style built images (default for smoke and acceptance):

```bash
pnpm compose:up
# or: docker compose up --build -d --wait
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4567
- Optional Collector: `docker compose --profile observability up -d`

Hot-reload development (bind-mounted source, Vite + `bun --watch`):

```bash
pnpm compose:dev
```

First start installs dependencies into Compose volumes. After `package.json` / lockfile changes, restart the stack so the entrypoint reinstalls. Stop with `pnpm compose:dev:down`.

Smoke from a clean volume (built stack only):

```bash
docker compose down -v
pnpm compose:smoke
```

Stop the built stack:

```bash
pnpm compose:down
# or: docker compose down
```

### Local development (without Docker)

Lighter alternative when you already have Node/pnpm/Bun on the host:

```bash
pnpm install
pnpm --filter @markr/backend db:migrate
pnpm --filter @markr/backend dev   # :4567
pnpm --filter @markr/frontend dev  # :3000, proxies to BACKEND_URL
```

Useful checks:

```bash
pnpm validate
pnpm test:integration
pnpm storybook:build
pnpm react:doctor
```

Example scanner-style import (also see [`task/example-requests.sh`](task/example-requests.sh)):

```bash
curl -i -X POST http://localhost:4567/import \
  -H 'Content-Type: text/xml+markr' \
  --data-binary @task/sample_results.xml
```

## Performance notes

Aggregate and histogram endpoints read pre-normalized stored marks and compute percentage rows in a single SQL pass before applying percentile/stddev/binning in process. That keeps hot paths off full-table XML reparse and avoids buffering large imports in memory. For Town Hall projection scale, the next wins are PostgreSQL (or a read replica), tighter indexes on `test_id`, and optional materialized rollups if import volume grows beyond a single SQLite writer. Polling with ETags keeps the dashboard live without pushing every unchanged payload to the browser.

## Manual Safari / VoiceOver checklist

Chromium automation covers Storybook interactions and axe checks. Before reviewer handoff, verify in Safari with VoiceOver:

- [ ] Upload page: heading, labelled file input, disabled Upload until valid file, alert vs status regions
- [ ] Tests list: empty and populated table, keyboard navigation to test links, stale/recovery announcements announced once
- [ ] Detail: aggregate labels/units, ten histogram bars with accessible names, not-found path
- [ ] Focus rings visible; reduced-motion preference respected
- [ ] Light and dark system appearances remain readable

## Repository map

- [`PLAN.md`](PLAN.md) — plan and todo list
- [`REQUIREMENTS.md`](REQUIREMENTS.md) — product requirements
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — implementation architecture
- [`NOTES.md`](NOTES.md) — decisions and trade-offs
- [`AGENTS.md`](AGENTS.md) — agent guidance
- [`task/`](task/) — immutable brief and fixtures
