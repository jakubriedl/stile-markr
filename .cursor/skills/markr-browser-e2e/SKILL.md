---
name: markr-browser-e2e
description: Runs Markr's destructive full-stack acceptance workflow with Docker Compose and Cursor's built-in browser, covering routes, uploads, live updates, accessibility, responsive states, and failures. Use only when explicitly requested.
disable-model-invocation: true
---

# Markr Built-in-Browser E2E

## Destructive warning

This workflow deletes the normal Docker Compose volume and all imported development results.

Before running:

1. State that `docker compose down -v` will erase local Markr data.
2. Obtain explicit confirmation unless the user's current request already explicitly authorizes the destructive full E2E reset.
3. Stop if required implementation files/scripts do not yet exist.
4. Do not modify or delete `task/`.

## Preparation

1. Read `REQUIREMENTS.md`, `ARCHITECTURE.md` sections 12.4 and 13, and `AGENTS.md`.
2. Verify the working tree and record the current revision.
3. Run the documented quality gate before browser work.
4. Run `docker compose down -v`, then build/start the default stack.
5. Wait for migration completion, backend readiness on port 4567, and frontend readiness on port 3000.
6. Keep observability optional; its absence must not block readiness.

Use a dedicated browser-use subagent for browser actions. Use role/name or accessibility-tree selectors, not brittle CSS selectors. Preserve screenshots only when they demonstrate a finding.

## Acceptance scenarios

### Empty and navigation

- Verify `/` has the exact heading, labelled file control, disabled/guarded upload, alert/status separation, and tests link.
- Verify `/tests` has the exact heading, accessible empty state, upload link, refresh timestamp, and no initial live announcement.
- Verify direct route reloads work.

### Upload

- Exercise no-file and wrong-type errors through the UI.
- Use browser runtime evaluation with `File` and `DataTransfer` if the built-in browser cannot attach a local fixture.
- Exercise exactly-50-MiB and over-50-MiB client guards with generated in-memory files; do not commit large fixtures.
- Upload `task/sample_results.xml` through the UI and verify the success announcement reports 81.
- Upload malformed XML and verify the alert channel and backend error.

Do not replace the primary successful upload scenario with curl.

### List and detail

- Verify test `9863`, count 81, available marks 20, canonical accessible link, and ordering.
- Verify all eight aggregate values and units against FIX-008.
- Verify ten semantic histogram bars, counts against FIX-009, and self-describing accessible names.
- Verify unknown-test not-found behavior and navigation.

### Live behavior

- Keep list/detail open and submit a state-changing result through a separate API action or browser tab.
- Verify visible data changes within ten seconds.
- Verify exactly one appropriate change announcement and no announcement on initial/no-op refresh.
- Stop the backend, verify stale data remains and failure is announced once, keep waiting through another poll, then restart and verify one recovery announcement.
- Verify `last refreshed` is visible UTC text and is not a live region.

### Accessibility and presentation

- Navigate all controls/links using keyboard only and verify visible focus.
- Inspect the accessibility tree for headings, labels, alerts/status, table/list semantics, statistic associations, and histogram descriptions.
- Emulate reduced motion and verify transitions are absent/instantaneous.
- Test representative mobile, tablet, and desktop widths without clipping or horizontal page overflow.
- Test system light and dark color schemes and automated contrast where browser tooling supports it.
- Inspect browser console and failed network requests throughout.

## Evidence and cleanup

Report:

- revision and environment;
- scenarios passed/failed;
- requirement IDs;
- observed live-update timing;
- accessibility-tree/keyboard/reduced-motion results;
- console/network findings;
- screenshots for failures;
- commands run; and
- residual manual Safari/VoiceOver checks.

Do not claim WCAG 2.2 AA solely from automated checks.

On completion, leave the clean stack running unless the user requests teardown. Clearly state that the previous development volume was deleted.
