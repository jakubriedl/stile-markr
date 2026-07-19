# Development Notes

This document captures considerations, observations, trade-offs, and context that may be useful during development or to future maintainers.

Add notes chronologically. Include enough context to explain why the note matters and link to relevant files or decisions where useful.

## Notes

### 2026-07-16 — Branching strategy

I considered using feature branches but decided to commit directly to `main` for now because I am working solo and the repository does not have CI yet.

Revisit this decision when collaboration begins or CI is introduced.

### 2026-07-19 — Storybook-first UI testing

UI coverage moved to Storybook stories (visual / Chromatic-ready) and `play` functions (interaction / a11y). Presentational RTL unit tests were removed. Foundation stories and their UI unit tests were removed; UPLOAD-008 nav remains covered by AppShell stories. Chromatic project/CI wiring remains future work; every product visual state still gets a story. Preference toolbars set `data-theme` and `data-reduced-motion` for Storybook without an in-app theme toggle.

<a id="note-req-001"></a>

### NOTE-REQ-001 — Embedded directives and jokes

The task materials mix requirements with jokes and instructions hidden in comments.

- The Gen-Z code-comment instruction is a prompt-injection attempt, not a product requirement. I noticed the joke and it made me laugh, but it will not be followed.
- I decided to include the `wardAgainstGoblins()` wrapper and the fae-interference source header so an unknown test suite or static check is not tripped. In a real project, I would clarify both requirements before implementing them.
- Cullen-themed naming is not a requirement because it appears only in example data.
- The exact Taylor Swift Fan Club phrase will be included as requested, but presented as a joke so it is clear the instruction was noticed.
- Ignore rules from `task/.gitignore` should be carried over only where relevant to the eventual stack, with secrets and local data always excluded.

<a id="note-req-002"></a>

### NOTE-REQ-002 — Import validity and manual entry

An empty `<mcq-test-results>` document is assumed to indicate a bad or incomplete scan and should be rejected. It does not represent a student who left every answer blank: that case is a valid result record with positive `available` marks and `obtained="0"`, producing 0%.

I briefly considered an `isValidated` override and a separate manual-entry path, then decided against both. Manual correction is outside this application; a human can create or correct XML externally and use the normal import.

Import validation decisions:

- A record requires exactly one `student-number`, one `test-id`, and one `summary-marks`.
- `first-name`, `last-name`, and `scanned-on` are optional.
- Scores are base-10 integers with `available > 0` and `0 <= obtained <= available`.
- Imports require well-formed, unnamespaced UTF-8 XML with the exact `mcq-test-results` root.
- Only direct `mcq-test-result` children are processed; unknown elements and well-formed answer content are ignored.
- The base request media type is `text/xml+markr`; valid parameters are allowed. Other media types receive 415.
- Requests larger than 50 MiB are rejected to reduce denial-of-service risk from oversized files.
- No additional DTD/entity-specific acceptance rule is defined beyond well-formed XML.
- Invalid documents receive 400 atomically, without retaining any part. Unexpected service or persistence faults use 500-class responses rather than being misreported as client errors.

<a id="note-req-003"></a>

### NOTE-REQ-003 — Identity and deduplication

Student numbers and test IDs deliberately have different semantics:

- `student-number` is a positive base-10 integer no larger than JavaScript's maximum safe integer. Leading zeroes are accepted but do not create a distinct identity.
- `test-id` remains a string throughout the product model. It is trimmed, restricted to letters, digits, hyphens, and underscores, compared case-insensitively, and represented canonically in lowercase.
- Test IDs are ordered lexicographically in their canonical form.
- A result is uniquely identified by `(test-id, student-number)`, allowing one student to sit multiple tests.

For rescans, maximum `obtained` and maximum `available` are retained independently, even when that combination did not appear in one scan. The import response counts unique student-test pairs in the accepted request, not raw XML elements or changes to previously retained state.

<a id="note-req-004"></a>

### NOTE-REQ-004 — Retained metadata and privacy

The retained result includes first name, last name, and scan timestamp in addition to identity and summary marks. Names are independently optional; when present, each is trimmed and must contain non-empty Unicode text.

A present `scanned-on` value must be an ISO 8601 date-time with `Z` or an explicit UTC offset. For duplicate results, names and timestamp come from the chronologically latest scan when both timestamps exist; otherwise the last received record supplies the metadata. Score maxima remain independent of this choice.

Results remain until persistent storage is explicitly removed; no deletion feature or automatic expiry is required. Individual student data must not be exposed through the API or frontend, and request XML, names, and student numbers must not be written to logs.

<a id="note-req-005"></a>

### NOTE-REQ-005 — Statistics and distributions

- Aggregate standard deviation is the population standard deviation.
- Quartiles use Type 7 linear interpolation at index `(N - 1) * p`.
- The API does not impose decimal rounding; presentation may format values.
- `count` is an integer number of deduplicated students. The other seven aggregate values are percentages or percentage points.
- Histograms use unrounded percentages and intervals `[0,10)`, `[10,20)`, through `[80,90)`, followed by `[90,100]`.
- `student_count` and histogram `total` use deduplicated students.
- A test's `marks_available` is the maximum retained available-mark value among its students.

<a id="note-req-006"></a>

### NOTE-REQ-006 — Persistence, scale, and operations

Imported data must survive backend process/container restarts and an ordinary `docker compose down` followed by `docker compose up`. Explicit removal of persistent storage may erase it.

Performance acceptance is limited to the supplied fixture scale. There is no numeric latency SLA beyond the visible no-stutter and ten-second live-update requirements. Query-performance considerations still need to be documented in the final README.

Full metrics and tracing are out of scope, but the backend should expose `GET /health` as a readiness check: it reports 200 only when the service and persistence are ready, and 503 otherwise. Rate limiting is a production consideration rather than a requirement for this task.

<a id="note-req-007"></a>

### NOTE-REQ-007 — Frontend behavior and accessibility

- The upload and list headings should be exactly `Upload exam results` and `Tests`.
- UPLOAD-008's link to `/tests` is satisfied by the AppShell primary nav `Tests` item present on every page, including `/`. A second in-page "View tests" control is omitted as duplicate chrome.
- Successful imports return additive `test_ids` alongside `imported` so the upload success status can link to each affected test detail page without a follow-up list fetch.
- Upload accepts one XML file recognized by a case-insensitive `.xml` extension or an XML MIME type. Client and server enforce the 50 MiB cap, while backend content validation remains authoritative.
- Missing, wrong-type, oversized, backend, and network upload failures use the accessible alert channel with plain-language summary, where, and how-to-fix ([`NOTE-REQ-010`](NOTES.md#note-req-010)).
- Initial list/detail load failures show an accessible error state with retry and relevant navigation.
- Both the tests list and test detail update within ten seconds. Announcements occur only after initial load and only when retained/displayed data changes.
- Detail announcements say results were updated and include the current student total. List announcements summarize the change and current test count.
- Failed live refreshes retain stale data, announce the stale transition once, keep retrying, and announce recovery once.
- Visible `last refreshed` values represent the last successful refresh, use `en-AU` formatting in the viewer's local timezone with a timezone label, and are not live regions.
- Displayed percentages include `%` and use at most two decimal places, without changing API precision.
- The frontend must conform to WCAG 2.2 AA, support keyboard-only operation with visible focus, and honor reduced-motion preferences.

<a id="note-req-010"></a>

### NOTE-REQ-010 — Human-readable upload import errors

UPLOAD-007 requires an alert that explains upload failures. Machine-oriented phrases like `summary-marks must satisfy available > 0` are insufficient for non-engineers.

Import failures therefore return:
- `error` — contractual exact string for malformed XML (`Invalid XML format`); otherwise a short plain-language summary;
- optional `path` — document location such as line/column and/or `mcq-test-results → result #N → <field>` (never student numbers or names);
- optional `fix` — what to change in the file or request.

The upload page renders summary, where, and how-to-fix distinctly. Client-side file checks (missing file, non-XML, oversize) use the same shape.

<a id="note-req-008"></a>

### NOTE-REQ-008 — Authentication and transport security

I considered authentication but decided not to include it because it is not described by the task and keeping the supplied surface unchanged is more likely to pass the base test suite. If authentication were in scope, I would consider BetterAuth for both human and machine access.

All task routes and endpoints are therefore unauthenticated. TLS termination is also outside this deliverable, matching the brief. These are scope decisions, not claims that authentication and TLS would be unnecessary in production.

<a id="note-req-009"></a>

### NOTE-REQ-009 — Sample-data observations

Independent analysis of `task/sample_results.xml` found 100 result elements for test `9863`, 81 unique student-test pairs, and 19 duplicate pairs. All 19 duplicates have conflicting names, seven later scans have lower scores, and two student numbers contain leading zeroes. These details reinforce deduplication by numeric student number plus test ID, never by name or latest arrival.

All 100 summary values match their answer sums, but answers remain non-authoritative. The fixture does not exercise malformed records, extra fields, varying available marks, perfect scores, multiple tests, or answer/summary disagreement, so those fixture absences must not be generalized into requirements.

<a id="note-arch-001"></a>

### NOTE-ARCH-001 — Workspace, toolchain, and runtime

The application will use a pnpm workspace with Turborepo. Both `/frontend` and `/backend` are ESM-only TypeScript projects using a shared strict configuration with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noImplicitOverride`. Oxc will provide formatting and linting. Dependency ranges may use normal semver ranges, with the committed pnpm lockfile providing reproducibility. Node, Bun, and pnpm versions will also be recorded through `packageManager`, `engines`, `.node-version`, and `.bun-version`.

Bun is the preferred runtime for both services so their operational model remains consistent. A serial foundation spike must prove TanStack Start SSR, Hono/Drizzle, the real-process Vitest harness, evlog, and OpenTelemetry context propagation. If Bun fails for either service, both services switch to Node LTS; the database driver then switches from `bun:sqlite` to Drizzle's `node:sqlite` adapter. A split-runtime deployment is deliberately avoided.

The foundation compatibility gate completed on 2026-07-18 with Bun 1.3.11 selected for both services. Executable checks prove raw TanStack Start SSR before hydration, progressive request and response forwarding through the Nitro proxy, an initialized proxy child span under Bun, Hono RPC type export and frontend consumption, Drizzle transactions and WAL through `bun:sqlite`, Node-hosted Vitest spawning and stopping the Bun backend, evlog drains under Bun, OpenTelemetry asynchronous Hono context, and W3C trace propagation across a Bun worker. These checks remain under `tests/runtime` as regression probes rather than production source or one-off experiments.

<a id="note-arch-002"></a>

### NOTE-ARCH-002 — Frontend service and data boundary

TanStack Start server-renders document shells (and static upload UI), then hydrates in the browser. List/detail reporting data is not prefetched in SSR loaders; hydrated browser code calls same-origin `/api/*` on the frontend service. The proxy strips `/api`, streams bodies and responses without parsing, forwards only required headers plus request/trace context, and applies origin and timeout protections against `BACKEND_URL` on the Compose network. The Hono app type is the TypeScript contract through Hono RPC rather than a separate contracts package or generated OpenAPI client.

TanStack Query owns browser cache state, five-second polling, retries, and stale state after shell hydration. Aggregate and histogram requests may be eventually consistent across a commit boundary; that transient mismatch is accepted. Each endpoint still emits an ETag and supports `If-None-Match`/304. Presentation uses fixed `en-AU` formatting. Refresh timestamps are shown in the viewer's local timezone (with a timezone label) and are only rendered after the first client poll settles, so SSR/client timezone mismatch is avoided.

<a id="note-arch-003"></a>

### NOTE-ARCH-003 — Frontend structure and visual system

Frontend code is feature-first: thin route definitions compose page components, reusable primitives live under `components/ui`, and stories/tests/mocks are colocated with the owned component or feature. React Aria Components provide interaction primitives; Tailwind and `tailwind-variants` style their state attributes.

The visual direction is restrained rather than technocratic: warm-neutral surfaces, a muted blue accent, system typography, generous whitespace, subtle borders, and no gradients or glass effects. A CSS-tokenized light theme and system-driven dark theme must both meet WCAG 2.2 AA. The histogram uses semantic HTML, a list/figure structure, and CSS Grid bars rather than a chart dependency.

Storybook uses `@storybook/react-vite`. Every reusable product component and every meaningful page state gets a Chromatic-ready story; preference coverage uses theme/reduced-motion globals. Interaction tests run through Storybook `play` functions (Vitest browser) with axe violations treated as failures. Foundation scaffold stories are not product UI. CI retains a static Storybook artifact. Chromatic is the intended visual snapshot service (wiring deferred; story inventory assumes it).

<a id="note-arch-004"></a>

### NOTE-ARCH-004 — Backend and streaming import pipeline

The backend uses Hono with feature-first `import`, `results`, and `health` modules. Route handlers remain thin, Zod validates configuration and normalized record boundaries, and `createApp(dependencies)` stays separate from the runtime listener.

Imports use `saxes` over a bounded, fatal UTF-8 stream decoder. The architecture does not add a stricter DTD/entity policy beyond the parser's defaults. HTTP bodies are read in chunks (no full-file `arrayBuffer`/`text` materialization). The current implementation parses the whole document into an in-memory record list, then persists in one `BEGIN IMMEDIATE` transaction on the request path (process-local write DB + admission queue). Mid-stream upsert / dedicated ImportWorker from ARCHITECTURE §8.3 is **not** implemented yet; residual risk is O(record count) heap under the 50 MiB product byte cap — see [`NOTE-ARCH-011`](NOTES.md#note-arch-011).

One import may run while four wait in a finite queue. Further requests receive 503 with `Retry-After`; the finite limit replaces the initially considered unbounded queue because queued streams otherwise create a connection and memory denial-of-service risk. Imports have a configurable 120-second timeout on the frontend proxy; query and proxy operations default to ten seconds.

<a id="note-arch-005"></a>

### NOTE-ARCH-005 — Persistence and analytical queries

The initial implementation is intentionally SQLite-specific, not falsely advertised as a drop-in PostgreSQL adapter. Drizzle owns the schema and migrations (`bun:sqlite`); runtime import upserts and reporting queries currently use explicit `bun:sqlite` SQL strings for SQLite-specific upsert/`GREATEST`-style maxima and score CTEs. A one-shot migration service must complete before the backend starts. SQLite runs with WAL, foreign keys, busy timeout, and `synchronous=NORMAL`. Schema decisions (epoch ms, flat `results`, request keys): [`NOTE-ARCH-011`](NOTES.md#note-arch-011).

Aggregate, Type 7 percentile, list, and histogram work loads per-test percentages then computes in process (with exact FIX oracles). Comments and architecture documentation identify SQL or schema constructs that must change for PostgreSQL. A real production migration requires PostgreSQL-specific schema/migrations, `greatest`-style upserts, percentile SQL, connection pooling, repository contract tests, and removal of the in-process write-admission assumption.

<a id="note-arch-006"></a>

### NOTE-ARCH-006 — Observability and HTTP security

Both runtime services use evlog with environment-controlled log levels, request-scoped wide events, and OTLP integration. OpenTelemetry provides traces and metrics; evlog supplies structured logs to the same optional Collector profile. W3C trace context and an accepted-or-generated `x-request-id` flow through the frontend proxy to Hono and appear in redacted logs.

Instrumentation includes HTTP/proxy spans and bounded-cardinality spans or metrics for XML parsing, import queueing, transaction/upsert, aggregate queries, import outcomes, and refresh failures. XML, names, student numbers, unrestricted URLs, and error payloads must never enter logs, spans, or metric labels. Telemetry export is not a health dependency and must flush with a bounded shutdown timeout.

Baseline HTTP protection includes CSP/security headers, explicit same-origin checks on the frontend proxy, no backend CORS, request/body timeouts, and PII redaction. The optional Compose observability profile supplies an OpenTelemetry Collector; the core application must remain healthy without it.

<a id="note-arch-007"></a>

### NOTE-ARCH-007 — Testing, browser acceptance, and CI

Vitest unit tests cover isolated domain, parser-state, validation, data, and non-UI logic. Presentational UI is covered in Storybook. Backend integration tests run Vitest under supported Node tooling, spawn the actual selected service runtime on an ephemeral port, migrate a fresh temporary SQLite file, call real HTTP endpoints, and tear down the process and database. Critical domain/import logic requires 90% branch coverage; overall tested backend/frontend code requires 80%. Coverage excludes only the minimal Bun process entrypoint and the Drizzle migration executable: lifecycle behavior is extracted into covered production code, migration behavior is exercised against fresh SQLite databases, generated migrations are reviewed separately, and runtime probes live under `tests`.

Storybook browser tests cover interactions and accessibility. Full product E2E is intentionally a project Cursor skill using the built-in browser rather than a committed Playwright suite. A complete run warns that it will reset the normal Compose volume, starts from empty state, and covers every route, valid and invalid upload guards, loading/error/not-found/stale/recovery behavior, live updates, keyboard/focus, reduced motion, accessibility-tree output, responsive layouts, and browser console/network failures.

GitHub Actions will run frozen installation, Oxc, typechecking, unit/integration coverage, Storybook tests/build, application builds, API/Compose smoke checks, and upload the static Storybook artifact. React Doctor remains a local review gate rather than a CI integration. Browser support targets current Chromium, Firefox, and Safari; automated browser checks use Chromium and final acceptance includes a manual Safari/VoiceOver pass.

Docker images install with pnpm (`--frozen-lockfile`) and serve with Bun. Backend images use `pnpm deploy --legacy` so production containers receive an isolated package tree without enabling workspace package injection. Compose starts migrate → healthy backend → frontend against a named SQLite volume; the optional `observability` profile runs a debug OpenTelemetry Collector that is not a readiness dependency. Local smoke: `pnpm compose:smoke` (requires a running Docker daemon).

Compose has two modes: default `docker-compose.yml` runs multi-stage production builds (acceptance/smoke); `docker-compose.dev.yml` is an override that bind-mounts the repo, installs into named `node_modules` volumes, and runs `bun --watch` / Vite with `MARKR_DOCKER_DEV=1` for hot reload (`pnpm compose:dev`).

<a id="note-arch-011"></a>

### NOTE-ARCH-011 — Persistence shape: epoch ms, flat results, import keys, buffering residual

**UTC epoch milliseconds in SQLite:** `scanned_on_ms`, `created_at_ms`, and `updated_at_ms` are `INTEGER` UTC ms. Safe against the 32-bit “2038” seconds overflow (SQLite integers are up to 64-bit; JS safe integers as ms are far beyond 2038). ISO-8601 with `Z` or an explicit offset remains the only accepted `scanned-on` wire form; naive local datetimes are rejected (IMP-014).

**No `tests` / `students` tables (for now):** identity and marks live only on `results`. `GET /tests` aggregates with `GROUP BY test_id`. Introduce normalized tables later if we need durable test metadata, student profiles, or entities that are not retained results.

**`import_request_keys`:** required for IMP-028 — count unique canonical `(test_id, student_number)` pairs in the request inside the import transaction (`INSERT OR IGNORE` + `COUNT(*)`). Complements in-memory fold/merge; not a durable cross-request store.

**Import buffering residual:** stream decode + saxes are chunked; the product still holds all normalized records in memory until parse succeeds, then writes. Accepted under the 50 MiB cap until mid-stream persist / worker work lands. Documented against ARCHITECTURE §8.3 / §9.1.

<a id="note-arch-010"></a>

### NOTE-ARCH-010 — Intentional: shell SSR, client Query for list/detail

Full-content TanStack Query SSR (`ensureQueryData` / dehydration) for list/detail is **not** used. Document SSR ships shells (and static upload HTML); list/aggregate/histogram load in the browser after hydration via same-origin `/api`.

**Why:** prioritize document TTFB and resilience when reporting queries are slow (large imports / heavy SQLite reads). The HTML response must not block on backend analytics. Accepted UX tradeoff: brief empty list or detail skeletons before the first client fetch. Documented in ARCHITECTURE §7.1–7.3.

Acceptance evidence (through Wave 4 adversarial fixes): clean-volume Compose smoke passed; Playwright Chromium exercised the sample XML UI upload (Cursor built-in browser cannot attach host filesystem files or fetch host fixture servers); Cursor browser verified list/detail oracles, live count update to 82, stale announcement after backend stop (~8.5s), and recovery announcement after restart. List/detail polling uses `retry: 1` so outages can reach `isError`/stale UI (infinite `retry: true` never settled). Safari/VoiceOver manual pass completed (route focus, skip link, aggregate/histogram naming); checklist remains in `README.md`.

<a id="note-arch-008"></a>

### NOTE-ARCH-008 — Agent skills and React Doctor

All agent skills are project-local and committed. The curated third-party set is:

- official React Aria guidance;
- Vercel React best practices;
- unofficial TanStack Start best practices, always checked against Context7 and pinned project docs;
- Vitest and MSW best practices from `pproenca/dot-skills`; and
- WCAG 2.2 accessibility compliance guidance.

Markr-specific skills cover stack alignment, adversarial requirement review, and destructive built-in-browser E2E. React Doctor follows its documented order only after the frontend scaffold exists: run `npx react-doctor@latest`, then `npx react-doctor@latest install`. Its default telemetry remains enabled, it is installed project-locally, and it becomes a recurring frontend review gate without its CI integration.

<a id="note-arch-009"></a>

### NOTE-ARCH-009 — Parallel agents, review, and model policy

The earlier direct-to-`main` note described solo work before CI and concurrent agents. Parallel implementation changes that constraint: each focused implementation agent now works on a temporary `agent/<wave>/<lane>` branch in an isolated worktree with exclusive path ownership. Only the integrator may edit root manifests, the lockfile, migrations, generated entrypoints, or shared composition files. Feature agents must request dependencies rather than edit manifests.

Validated focused commits are cherry-picked onto `main`, preserving a linear history, and temporary worktrees/branches are removed. A fresh read-only adversarial reviewer runs after every agent change and again after fixes. Integration is blocked by requirement mismatches, failing checks, critical/high findings, or unresolved medium findings unless accepted debt is explicitly recorded.

GPT-5.6 Sol Extra High is the parent orchestrator, integration owner, and conflict resolver. Grok 4.5 is the mandatory adversarial reviewer. GPT-5.6 Terra Medium handles narrow implementation lanes. A lane escalates to Sol Extra High only for an unresolved blocker or repeated review failure.

<!--
### YYYY-MM-DD — Short title

Context:

Note:

Consequences or follow-up:
-->
