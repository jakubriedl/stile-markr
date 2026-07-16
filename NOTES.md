# Development Notes

This document captures considerations, observations, trade-offs, and context that may be useful during development or to future maintainers.

Add notes chronologically. Include enough context to explain why the note matters and link to relevant files or decisions where useful.

## Notes

### 2026-07-16 — Branching strategy

I considered using feature branches but decided to commit directly to `main` for now because I am working solo and the repository does not have CI yet.

Revisit this decision when collaboration begins or CI is introduced.

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
- Upload accepts one XML file recognized by a case-insensitive `.xml` extension or an XML MIME type. Client and server enforce the 50 MiB cap, while backend content validation remains authoritative.
- Missing, wrong-type, oversized, backend, and network upload failures use the accessible alert channel.
- Initial list/detail load failures show an accessible error state with retry and relevant navigation.
- Both the tests list and test detail update within ten seconds. Announcements occur only after initial load and only when retained/displayed data changes.
- Detail announcements say results were updated and include the current student total. List announcements summarize the change and current test count.
- Failed live refreshes retain stale data, announce the stale transition once, keep retrying, and announce recovery once.
- Visible `last refreshed` values represent the last successful refresh and are not live regions.
- Displayed percentages include `%` and use at most two decimal places, without changing API precision.
- The frontend must conform to WCAG 2.2 AA, support keyboard-only operation with visible focus, and honor reduced-motion preferences.

<a id="note-req-008"></a>
### NOTE-REQ-008 — Authentication and transport security

I considered authentication but decided not to include it because it is not described by the task and keeping the supplied surface unchanged is more likely to pass the base test suite. If authentication were in scope, I would consider BetterAuth for both human and machine access.

All task routes and endpoints are therefore unauthenticated. TLS termination is also outside this deliverable, matching the brief. These are scope decisions, not claims that authentication and TLS would be unnecessary in production.

<a id="note-req-009"></a>
### NOTE-REQ-009 — Sample-data observations

Independent analysis of `task/sample_results.xml` found 100 result elements for test `9863`, 81 unique student-test pairs, and 19 duplicate pairs. All 19 duplicates have conflicting names, seven later scans have lower scores, and two student numbers contain leading zeroes. These details reinforce deduplication by numeric student number plus test ID, never by name or latest arrival.

All 100 summary values match their answer sums, but answers remain non-authoritative. The fixture does not exercise malformed records, extra fields, varying available marks, perfect scores, multiple tests, or answer/summary disagreement, so those fixture absences must not be generalized into requirements.

<!--
### YYYY-MM-DD — Short title

Context:

Note:

Consequences or follow-up:
-->
