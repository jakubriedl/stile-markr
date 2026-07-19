# Import fixtures

Committed XML (and one text) fixtures for backend import HTTP stress tests. Do not modify `task/`; the sample oracle remains `task/sample_results.xml`.

Unless noted, send with `Content-Type: text/xml+markr`.

Error responses use `{ error, path?, fix? }`. Malformed XML keeps `error: "Invalid XML format"` and adds location/fix guidance.

| File | Intent | Expected HTTP |
|------|--------|---------------|
| `valid-single-test.xml` | Thin valid single-test smoke | `200` `{ imported: 1, test_ids: ["exam_a"] }` |
| `valid-multi-test.xml` | Multiple `test-id`s | `200` `{ imported: 3, test_ids: ["test_a", "test_b"] }` (sorted) |
| `valid-duplicates-fold.xml` | Within-request duplicates → fold + IMP-028 unique-pair count | `200` `{ imported: 2, test_ids: ["fold_1"] }`; retained obtained for student 42 is 8 |
| `valid-stats-edge-cases.xml` | Crafted marks for aggregate/histogram edges | `200` then see stats assertions in integration tests |
| `broken-unclosed-tag.xml` | Malformed structure | `400` `error: Invalid XML format` + `path`/`fix` |
| `broken-wrong-root.xml` | Wrong root element | `400` descriptive error + root `path`/`fix` |
| `broken-missing-required.xml` | Missing student-number | `400` missing-required guidance for result #1 |
| `broken-available-zero.xml` | `available=0` divide-by-zero guard | `400` summary-marks guidance |
| `broken-negative-marks.xml` | Negative obtained | `400` summary-marks guidance |
| `empty-mcq-results.xml` | Well-formed empty container (IMP-010) | `400` no-results guidance |
| `not-xml.txt` | Garbage body with markr media type | `400` `Invalid XML format` + guidance |
| `not-xml.xml` | XML extension with garbage | `400` `Invalid XML format` + guidance |
| `xml-but-wrong-content-type.xml` | Valid XML bytes | `415` when sent with e.g. `application/xml` |

Large (~100 KiB) first-name payloads are generated in the integration test at runtime rather than committed as a fixture file.

## Stats edge fixture (`valid-stats-edge-cases.xml`)

| test_id | Scores (obtained/available → %) | Notes |
|---------|----------------------------------|-------|
| `single` | 10/20 → 50% (N=1) | stddev 0; all percentiles 50 |
| `equal` | 20/20 ×3 → 100% | stddev 0; all in last histogram bin |
| `edges` | 0%, 10%, 100% | bins 0, 1, and 9 (100% clamped) |
| `type7` | 10, 20, 30, 40% (N=4) | p25=17.5, p50=25, p75=32.5 |
