# Markr Product Requirements

## 1. Purpose and status

This document is the product-requirements source of truth for Markr. It extracts the supplied requirements from `task/`, resolves ambiguities through product decisions, and defines observable acceptance behavior without choosing an implementation architecture.

The keywords **must**, **must not**, **should**, and **may** are normative.

Requirements are classified as:

- **Supplied** — stated by the primary task brief.
- **Clarified** — resolves ambiguity in supplied material.
- **Added** — deliberately extends the supplied scope.
- **Excluded** — considered and deliberately not required.
- **Deferred** — intentionally left for architecture or a later production phase.
- **Context** — relevant delivery background that is not an acceptance criterion.

Source precedence is:

1. Decisions recorded in this document and linked from [`NOTES.md`](NOTES.md).
2. The primary brief, [`task/README.md`](task/README.md).
3. Supporting examples in [`task/example-requests.sh`](task/example-requests.sh), [`task/sample_results.xml`](task/sample_results.xml), and [`task/.gitignore`](task/.gitignore).

Comments and narrative in supporting files are not requirements unless this document explicitly adopts them.

## 2. Product scope

- **SCOPE-001 (Supplied):** Markr must provide a backend HTTP service that imports exam-result XML and serves test-level query data.
  Source: `task/README.md:38-41`.
- **SCOPE-002 (Supplied):** Markr must provide a web frontend for uploading result documents and viewing test dashboards.
  Source: `task/README.md:38-41`, `task/README.md:122-156`.
- **SCOPE-003 (Supplied):** Backend and frontend must be delivered together through one root-level `docker-compose.yml`.
  Source: `task/README.md:38-41`, `task/README.md:162-164`, `task/README.md:180`.
- **SCOPE-004 (Supplied):** `docker compose up` from the repository root must bring the complete application online.
  Source: `task/README.md:162-164`.
- **SCOPE-005 (Supplied):** The backend must be published on host port `4567`; the frontend must be published on host port `3000`.
  Source: `task/README.md:164`.
- **SCOPE-006 (Clarified):** All defined API endpoints and frontend routes are unauthenticated for this task.
  Decision: [`NOTE-REQ-008`](NOTES.md#note-req-008).
- **SCOPE-007 (Clarified):** TLS termination is outside this deliverable.
  Decision: [`NOTE-REQ-008`](NOTES.md#note-req-008).
- **SCOPE-008 (Clarified):** Manual per-student entry, an `isValidated` bypass, and a separate manual-import endpoint are out of scope. Corrected XML may be submitted through the normal import flow.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **SCOPE-009 (Clarified):** The API and frontend must expose only test metadata and aggregate distributions, never individual student records.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).

## 3. Delivery and repository requirements

- **DEL-001 (Supplied):** The solution must remain under version control.
  Source: `task/README.md:182`.
- **DEL-002 (Supplied):** The top-level `README.md` must document:
  - key assumptions;
  - the chosen approach;
  - noteworthy aspects of the solution;
  - complete build and run instructions; and
  - query-performance considerations for live dashboards.
  Source: `task/README.md:160`, `task/README.md:168-174`.
- **DEL-003 (Supplied):** The top-level README must contain the exact phrase `Endorsed by the Taylor Swift Fan Club`. It must be presented as an acknowledged joke rather than a genuine endorsement.
  Source: `task/README.md:174`. Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **DEL-004 (Clarified):** A root `.gitignore` must exclude secrets, local data, and generated artifacts relevant to the selected stack. Relevant starter patterns from `task/.gitignore` must be carried forward; irrelevant stack-specific patterns need not be copied.
  Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **DEL-005 (Deferred):** Languages, frameworks, persistence technology, live-update transport, source layout, and other architecture choices remain unrestricted until architecture design.
  Source: `task/README.md:53`, `task/README.md:124`, `task/README.md:181`.
- **DEL-006 (Context):** The brief suggests a four-to-five-hour implementation target for an experienced AI-assisted developer. This is planning context, not a runtime acceptance criterion.
  Source: `task/README.md:185`.

## 4. Global API contract

- **API-001 (Supplied):** The backend must expose:
  - `POST /import`;
  - `GET /results/:test-id/aggregate`;
  - `GET /tests`; and
  - `GET /results/:test-id/histogram`.
  Source: `task/README.md:47-120`.
- **API-002 (Added):** The backend must also expose `GET /health`.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **API-003 (Clarified):** Every API response with a body, including success and error responses, must declare `Content-Type: application/json`.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **API-004 (Clarified):** Documented error messages are exact contracts:
  - malformed XML: `{"error":"Invalid XML format"}`;
  - unknown test: `{"error":"Not found"}`.
  Other validation and operational errors must use a descriptive JSON error string.
  Source: `task/README.md:74`, `task/README.md:85`, `task/README.md:120`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **API-005 (Clarified):** Client document-validation failures use `400`; unsupported import media types use `415`; oversized bodies use `413`; unknown tests use `404`; unexpected service or persistence failures use an appropriate `500`-class response.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **API-006 (Clarified):** API JSON numbers are not required to preserve textual decimal formatting such as a trailing `.0`. Numeric meaning, not JSON spelling, is contractual.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).

## 5. Import contract

### 5.1 Request envelope

- **IMP-001 (Supplied):** Exam-result documents must be accepted at `POST /import`.
  Source: `task/README.md:49-51`.
- **IMP-002 (Clarified):** The request's base media type must be `text/xml+markr`. Valid media-type parameters, including a charset parameter, are allowed. Any other base media type must be rejected with `415 Unsupported Media Type`.
  Source: `task/README.md:51`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-003 (Added):** The request body must not exceed 50 MiB (`52,428,800` bytes). A larger request must be rejected with `413 Payload Too Large` without importing any record. Exactly 50 MiB remains within the limit.
  Decision and rationale: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-004 (Clarified):** Import documents must be UTF-8, with or without a matching XML declaration.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-005 (Clarified):** The body must be well-formed XML. Syntactically malformed content anywhere in the document—including inside an otherwise ignored `<answer>`—must reject the complete request.
  Source: `task/README.md:73-74`; malformed illustration at `task/README.md:26`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-006 (Clarified):** DTD and entity behavior has no additional acceptance contract in this requirements phase beyond well-formed XML. It remains a security/parser decision for architecture.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).

### 5.2 Document shape

- **IMP-007 (Clarified):** The root element must be the exact unnamespaced element `<mcq-test-results>`. A different root or a namespaced root must be rejected as an invalid document.
  Source: `task/README.md:17`, `task/README.md:57`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-008 (Clarified):** Only direct `<mcq-test-result>` children of the root are result records. Nested result elements must not be discovered by searching arbitrary descendants.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-009 (Clarified):** Unknown root children and unknown fields within a result must be ignored. XML comments must not affect processing.
  Source: `task/README.md:32`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-010 (Clarified):** The document must contain at least one direct result record. An empty root must be rejected with `400` as an incomplete scan.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-011 (Supplied):** `<summary-marks>` is authoritative. `<answer>` elements and their values must not contribute to validation of the score, deduplication, aggregates, or histograms. Well-formed answer content may be absent, incomplete, contradictory, or otherwise unusual without invalidating a record.
  Source: `task/README.md:32`.

### 5.3 Record validity

- **IMP-012 (Clarified):** Every `<mcq-test-result>` must contain exactly one of each:
  - `<student-number>`;
  - `<test-id>`; and
  - `<summary-marks>`.
  A missing or repeated required field invalidates the entire document.
  Source ambiguity: `task/README.md:73`. Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-013 (Clarified):** `<first-name>` and `<last-name>` are independently optional and may each appear at most once. When present, surrounding whitespace is removed and the remaining value must be non-empty Unicode text.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **IMP-014 (Clarified):** The `scanned-on` attribute is optional. When present, it must be an ISO 8601 date-time containing `Z` or an explicit UTC offset. An invalid present value invalidates the entire document.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **IMP-015 (Clarified):** `<student-number>` must contain decimal digits only. Its numeric value must be greater than zero and no greater than `9,007,199,254,740,991`. Leading zeroes are allowed on input but are normalized away for identity.
  Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **IMP-016 (Clarified):** `<test-id>` must be a non-empty string after trimming and must contain only ASCII letters, decimal digits, hyphens, and underscores. Test identity is case-insensitive, and its canonical representation is lowercase.
  Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **IMP-017 (Clarified):** `<summary-marks>` must contain exactly one `available` and one `obtained` attribute. Both must be base-10 integers satisfying:
  - `available > 0`;
  - `obtained >= 0`; and
  - `obtained <= available`.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).
- **IMP-018 (Clarified):** A result with positive `available` and `obtained="0"` is valid and represents 0%, including when it has no `<answer>` elements or no marked answers.
  Decision and rationale: [`NOTE-REQ-002`](NOTES.md#note-req-002).

### 5.4 Atomicity and deduplication

- **IMP-019 (Supplied):** A document containing any invalid result must be rejected in full. No result, metadata update, or score update from that request may remain persisted.
  Source: `task/README.md:73`.
- **IMP-020 (Clarified):** A retained result is uniquely identified by canonical `(test-id, student-number)`. Names and timestamps never participate in identity.
  Source ambiguity: `task/README.md:71-72`. Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **IMP-021 (Supplied, clarified):** Across duplicates in one request or many requests, the retained `obtained` value must be the maximum observed `obtained`, and retained `available` must independently be the maximum observed `available`. The retained pair may therefore combine maxima from different scans.
  Source: `task/README.md:71-72`. Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **IMP-022 (Clarified):** Deduplication must be order-independent for retained score maxima. A later lower score must never replace a higher score.
  Source: `task/README.md:71`; fixture evidence: [`NOTE-REQ-009`](NOTES.md#note-req-009).
- **IMP-023 (Clarified):** Retained names and timestamp come from the chronologically latest duplicate when both records have valid timestamps. If either timestamp is absent, or timestamps are equal, the last received record supplies this metadata. Score maxima remain independent.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **IMP-024 (Clarified):** Concurrent accepted imports affecting the same identity must converge to the same independent score maxima as serial processing. No accepted higher maximum may be lost.
  Consequence of IMP-021 and atomicity; decision context: [`NOTE-REQ-003`](NOTES.md#note-req-003).

### 5.5 Persistence and response

- **IMP-025 (Supplied, clarified):** Accepted results must persist across backend process/container restarts and an ordinary `docker compose down` followed by `docker compose up`. Explicit deletion of persistent storage may erase them.
  Source: `task/README.md:53`. Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **IMP-026 (Clarified):** Persisted result data must include canonical test ID, numeric student number, retained `obtained` and `available`, optional first and last names, and optional scan timestamp. Raw XML, answer elements, and unknown elements need not be retained.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **IMP-027 (Clarified):** Accepted data remains available until persistent storage is explicitly removed. Automatic expiry and a product deletion feature are not required.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **IMP-028 (Supplied, clarified):** A successful import returns `200 OK` with `{"imported":N}`. `N` is the number of unique canonical `(test-id, student-number)` pairs in that request after within-request deduplication, regardless of whether those pairs already existed or changed retained state.
  Source ambiguity: `task/README.md:67-74`. Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **IMP-029 (Clarified):** Re-importing the same valid document returns the same unique-pair count while leaving aggregate state unchanged. A no-op re-import must not create duplicate students.
  Consequence of IMP-020, IMP-021, and IMP-028.
- **IMP-030 (Supplied):** Malformed XML returns `400 Bad Request` and the exact JSON body `{"error":"Invalid XML format"}`. Other invalid-document failures return `400` with a descriptive JSON error.
  Source: `task/README.md:74`.

## 6. Aggregate endpoint

- **AGG-001 (Supplied):** `GET /results/:test-id/aggregate` must return aggregate statistics for a known canonical test ID.
  Source: `task/README.md:76-85`.
- **AGG-002 (Clarified):** The path ID is normalized by the same test-ID rules as import. Unknown valid IDs return `404 Not Found` with exact body `{"error":"Not found"}`.
  Source: `task/README.md:85`. Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **AGG-003 (Supplied):** A successful response contains exactly these required fields:
  - `mean`;
  - `stddev`;
  - `min`;
  - `max`;
  - `p25`;
  - `p50`;
  - `p75`; and
  - `count`.
  Source: `task/README.md:78-83`.
- **AGG-004 (Clarified):** Each retained student's percentage is `obtained / available * 100`, using the independently retained maxima. All statistics except `count` operate on these per-student percentages.
  Source: `task/README.md:78`. Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **AGG-005 (Clarified):** `count` is an integer number of deduplicated students for the test. The other seven values are JSON numbers from 0 through 100; `stddev` is expressed in percentage points.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **AGG-006 (Clarified):** `stddev` is population standard deviation:

  `sqrt(sum((x - mean)^2) / N)`

  A one-student test has standard deviation `0`.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **AGG-007 (Clarified):** `p25`, `p50`, and `p75` use Type 7 linear interpolation over sorted percentages. For percentile fraction `p`, interpolate at zero-based index `(N - 1) * p`.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **AGG-008 (Clarified):** The API must not intentionally round aggregate results to a fixed number of decimal places. Normal numeric serialization precision is acceptable.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).

## 7. Test-list endpoint

- **TEST-001 (Supplied):** `GET /tests` must return `200 OK` with `{"tests":[]}` when no tests exist. It must not return 404 merely because the list is empty.
  Source: `task/README.md:87-101`.
- **TEST-002 (Supplied):** Each test item must contain:
  - `test_id`;
  - `student_count`; and
  - `marks_available`.
  Source: `task/README.md:91-99`.
- **TEST-003 (Clarified):** `test_id` is the canonical lowercase string form defined by IMP-016.
  Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **TEST-004 (Clarified):** Results must be ordered by canonical `test_id` using ascending case-normalized lexicographic string order.
  Source ambiguity: `task/README.md:89`. Decision: [`NOTE-REQ-003`](NOTES.md#note-req-003).
- **TEST-005 (Clarified):** `student_count` is the number of retained unique students for that test after deduplication.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **TEST-006 (Clarified):** `marks_available` is the maximum retained `available` value among students in that test.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **TEST-007 (Clarified):** Ordinary empty-state behavior still yields 200, but unexpected service or persistence failures may return an appropriate `500`-class response.
  Decision: [`NOTE-REQ-002`](NOTES.md#note-req-002).

## 8. Histogram endpoint

- **HIST-001 (Supplied):** `GET /results/:test-id/histogram` must return a score distribution for a known test.
  Source: `task/README.md:103-120`.
- **HIST-002 (Supplied):** A successful response must contain `bins` and `total`. Every bin must contain `lower_pct`, `upper_pct`, and integer `count`.
  Source: `task/README.md:107-117`.
- **HIST-003 (Supplied, clarified):** `bins` must always contain these ten bins in ascending order, including bins with zero count:
  - `[0,10)`;
  - `[10,20)`;
  - `[20,30)`;
  - `[30,40)`;
  - `[40,50)`;
  - `[50,60)`;
  - `[60,70)`;
  - `[70,80)`;
  - `[80,90)`; and
  - `[90,100]`.
  Source: `task/README.md:105-120`. Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **HIST-004 (Clarified):** Binning uses each student's unrounded `obtained / available * 100` value. Exact lower boundaries enter the bin beginning at that boundary; 100 enters the final bin.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **HIST-005 (Clarified):** `total` is the test's deduplicated student count and must equal the sum of all bin counts and the aggregate endpoint's `count`.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).
- **HIST-006 (Supplied):** An unknown test returns `404 Not Found` with exact body `{"error":"Not found"}`.
  Source: `task/README.md:120`.

## 9. Health endpoint

- **HEALTH-001 (Added):** `GET /health` is a readiness check for the backend and its persistence dependency.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **HEALTH-002 (Added):** When the backend can serve requests and persistence is ready, it returns `200 OK` with `{"status":"ok"}`.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **HEALTH-003 (Added):** When readiness fails, it returns `503 Service Unavailable` with a JSON body describing unavailable status. The failure body has no stricter wording contract.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **HEALTH-004 (Clarified):** Metrics, tracing, and separate liveness/readiness endpoints are not required.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).

## 10. Frontend-wide requirements

- **WEB-001 (Supplied):** The frontend must work in a modern browser and provide:
  - `/`;
  - `/tests`; and
  - `/tests/:test-id`.
  Source: `task/README.md:122-156`.
- **WEB-002 (Added):** All three routes must conform to WCAG 2.2 Level AA.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **WEB-003 (Added):** Every control and navigation path must be usable with a keyboard alone and must have a visible focus indicator.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **WEB-004 (Supplied):** The frontend must respect `prefers-reduced-motion: reduce`; animations must be removed or become effectively instantaneous. A frontend with no relevant animation satisfies this requirement.
  Source: `task/README.md:155`.
- **WEB-005 (Clarified):** Initial API/network failures on list and detail routes must produce an accessible error state with a retry action and relevant navigation.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **WEB-006 (Clarified):** Percentage values shown to users must include the percent unit and use no more than two decimal places. This display formatting must not change API precision.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **WEB-007 (Clarified):** Student counts must be presented as integer totals, not percentages.
  Decision: [`NOTE-REQ-005`](NOTES.md#note-req-005).

## 11. Upload page

- **UPLOAD-001 (Clarified):** `/` must have the exact visible page heading `Upload exam results`.
  Source: `task/README.md:128`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **UPLOAD-002 (Supplied):** The page must contain a file picker with a clearly associated label and an `Upload` button.
  Source: `task/README.md:129-130`.
- **UPLOAD-003 (Clarified):** The picker accepts one file. It must advertise XML files and recognize a file as XML when it has a case-insensitive `.xml` extension or a recognized XML MIME type. Backend validation remains authoritative.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **UPLOAD-004 (Clarified):** The page must prevent submission when there is no selected file, the selected file is not recognized as XML, or it exceeds 50 MiB.
  Source: `task/README.md:130`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **UPLOAD-005 (Supplied):** The upload must send the selected bytes to `POST /import` with base `Content-Type: text/xml+markr`.
  Source: `task/README.md:135`.
- **UPLOAD-006 (Supplied, clarified):** On success, the page must remain on `/` and make a polite status announcement reporting the backend's unique-pair `imported` count.
  Source: `task/README.md:131`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **UPLOAD-007 (Supplied, clarified):** Empty selection, wrong file type, oversize file, network failure, and backend rejection must use an attention-grabbing accessible alert that explains the failure. This alert must remain a distinct announcement channel from success.
  Source: `task/README.md:130-132`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **UPLOAD-008 (Supplied):** The page must contain a link to `/tests`.
  Source: `task/README.md:133`.

## 12. Tests list page

- **LIST-001 (Clarified):** `/tests` must have the exact visible page heading `Tests`.
  Source: `task/README.md:141`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **LIST-002 (Supplied):** The page must show every known test in a list or table with `test_id`, `student_count`, and `marks_available`.
  Source: `task/README.md:142`.
- **LIST-003 (Supplied):** Every test row must be or contain a link to `/tests/:test-id`, and the link's accessible name must include the canonical test ID.
  Source: `task/README.md:143`.
- **LIST-004 (Supplied):** When no tests exist, the page must show a clear empty state with a link to `/`.
  Source: `task/README.md:144`.
- **LIST-005 (Added):** The list must reflect new or changed test-list data within ten seconds without manual refresh.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **LIST-006 (Added):** No list-change announcement occurs on initial load. Afterward, when displayed list data changes, a polite announcement must state that the list changed and give the current test count. Refreshes that do not change displayed list data must not announce a change.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **LIST-007 (Clarified):** The page must show a visible `last refreshed` value representing the most recent successful refresh. It must use `en-AU` formatting in the viewer's local timezone (with a timezone label), and must not be a live region.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **LIST-008 (Added):** If a refresh fails after data loaded, the page must retain stale data, visibly identify it as stale, announce the stale transition once, continue retrying, and announce recovery once. Repeated failures must not cause repeated announcements.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).

## 13. Test detail page

- **DETAIL-001 (Supplied):** `/tests/:test-id` must have a page heading containing the canonical test ID.
  Source: `task/README.md:148`.
- **DETAIL-002 (Supplied):** The page must show all eight aggregate values: `mean`, `count`, `p25`, `p50`, `p75`, `min`, `max`, and `stddev`.
  Source: `task/README.md:149`.
- **DETAIL-003 (Supplied):** Every aggregate value must be programmatically associated with its label and unit so assistive technology presents the label and value as one understandable item.
  Source: `task/README.md:149`.
- **DETAIL-004 (Supplied):** The histogram must have an accessible name and use discrete inspectable DOM elements for bars. A canvas-only chart is not acceptable.
  Source: `task/README.md:150`.
- **DETAIL-005 (Supplied):** Every histogram bar must have an accessible description containing its score range and student count.
  Source: `task/README.md:151`.
- **DETAIL-006 (Supplied):** Retained result changes for the current test must be reflected within ten seconds without manual refresh.
  Source: `task/README.md:152`.
- **DETAIL-007 (Clarified):** A retained result change means a new student or an improved `obtained`/`available` maximum. An accepted import that leaves retained state unchanged must not trigger a change announcement.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **DETAIL-008 (Supplied, clarified):** No result-change announcement occurs on initial load. Afterward, a polite announcement must state that results were updated and give the current student total; it must not recite all statistics.
  Source: `task/README.md:153`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **DETAIL-009 (Supplied, clarified):** A separate visible `last refreshed` value must represent the most recent successful refresh. It must use `en-AU` formatting in the viewer's local timezone (with a timezone label), and must not be a live region.
  Source: `task/README.md:154`. Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **DETAIL-010 (Clarified):** If a refresh fails after data loaded, the page must retain stale data, visibly identify it as stale, announce the stale transition once, continue retrying, and announce recovery once.
  Decision: [`NOTE-REQ-007`](NOTES.md#note-req-007).
- **DETAIL-011 (Supplied):** An unknown test must show a clear not-found state with a link to `/tests`.
  Source: `task/README.md:156`.

## 14. Performance, privacy, and operational boundaries

- **NFR-001 (Supplied):** Live aggregate and histogram refreshes must not visibly stutter during normal use.
  Source: `task/README.md:158-160`.
- **NFR-002 (Clarified):** Acceptance-scale performance is limited to the supplied fixture. No larger record-volume guarantee is defined.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **NFR-003 (Clarified):** No numeric server-latency percentile or throughput SLA is defined beyond the ten-second frontend freshness deadline and no-visible-stutter requirement.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **NFR-004 (Added):** Logs must not contain request XML, first or last names, or student numbers. Operational counts and non-PII error context may be logged.
  Decision: [`NOTE-REQ-004`](NOTES.md#note-req-004).
- **NFR-005 (Clarified):** Application-level rate limiting is not required for this task. The request-size cap remains mandatory.
  Decision: [`NOTE-REQ-006`](NOTES.md#note-req-006).
- **NFR-006 (Deferred):** Production authentication, authorization, TLS, rate limiting, broader observability, backup, recovery, and capacity targets require future product and architecture work.
  Decision context: [`NOTE-REQ-006`](NOTES.md#note-req-006), [`NOTE-REQ-008`](NOTES.md#note-req-008).

## 15. Derived fixture acceptance oracles

These facts are acceptance oracles for [`task/sample_results.xml`](task/sample_results.xml), not general limits on valid input.

- **FIX-001:** The file is well-formed UTF-8 XML with root `mcq-test-results`.
- **FIX-002:** It contains 100 raw result elements, 2,000 answer elements, one test ID (`9863`), 81 unique canonical student-test pairs, and 19 duplicate pairs.
- **FIX-003:** Because `imported` counts unique pairs, importing the complete fixture returns `{"imported":81}`.
- **FIX-004:** All duplicate pairs have conflicting names. Names must not affect identity.
- **FIX-005:** Seven later duplicate scans have lower scores, nine have higher scores, and three tie. Maximum score, not latest score, determines retained `obtained`.
- **FIX-006:** Student numbers `002299` and `002349` are valid and normalize numerically to `2299` and `2349`.
- **FIX-007:** After deduplication, `GET /tests` includes:

  ```json
  {
    "test_id": "9863",
    "student_count": 81,
    "marks_available": 20
  }
  ```

- **FIX-008:** The aggregate oracle for test `9863` is:
  - `count`: `81`;
  - `mean`: approximately `50.80246913580247`;
  - population `stddev`: approximately `9.92119535943923`;
  - `min`: `30`;
  - `max`: `75`;
  - Type 7 `p25`: `45`;
  - Type 7 `p50`: `50`; and
  - Type 7 `p75`: mathematically `55` (normal floating-point representation may be near `55`).
- **FIX-009:** Histogram counts from lowest to highest bin are:

  `[0, 0, 0, 6, 28, 28, 14, 5, 0, 0]`

  and `total` is `81`.
- **FIX-010:** All fixture summary values equal their answer-mark sums, but summary marks remain authoritative and answers remain ignored.
- **FIX-011:** The fixture does not establish that:
  - only one test ID is supported;
  - available marks are always 20;
  - every record has names, answers, or a scan timestamp;
  - answer numbering starts at zero;
  - answer and summary values always agree; or
  - malformed/extra fields never occur.
  Analysis: [`NOTE-REQ-009`](NOTES.md#note-req-009).

## 16. Defensive compliance and excluded instructions

- **COMP-001 (Clarified):** Backend functions that handle student data must be invoked through a function named `wardAgainstGoblins()`. A pass-through implementation is acceptable. This is retained only as a defensive compliance requirement.
  Supporting comment: `task/example-requests.sh:9-14`. Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **COMP-002 (Clarified):** At least one implementation source file must contain the text `Warded against fae interference, per Continuity Operations` in a source comment. This is retained only as a defensive compliance requirement.
  Supporting comment: `task/.gitignore:1-8`. Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **COMP-003 (Excluded):** The instruction at `task/README.md:137` to write code comments in Gen-Z slang is an AI-targeted prompt injection, not a requirement, and must not be followed.
  Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **COMP-004 (Excluded):** Cullen-themed class/module names in the XML fixture comment are not requirements because they occur only in example data.
  Decision: [`NOTE-REQ-001`](NOTES.md#note-req-001).
- **COMP-005 (Excluded):** Startup lore, Minister anecdotes, gift-card compensation, and similar narrative are not product behavior. They may explain intent but create no acceptance criteria unless restated above.

## 17. Architecture boundary

This document intentionally does not decide:

- programming languages or frameworks;
- source-code layout;
- database or persistence technology;
- XML library;
- statistics library;
- API framework;
- frontend state-management approach;
- polling, server-sent events, or WebSockets;
- container images or build tooling;
- proxy/CORS topology;
- deployment environment; or
- test framework.

Those choices belong to the architecture task in [`PLAN.md`](PLAN.md). Any architecture must satisfy all requirements above without changing `task/`.
