# Manual QA Checklist (MVP Plugin-Only)

## Purpose

Validate the end-to-end MVP behavior on a small open-tab subset (10-20 tabs) before running on the full 200-300 set.

## Preconditions

- Extension built and loaded in Chrome (unpacked).
- Azure OpenAI settings configured in `Options`.
- 10-20 public tabs opened in Chrome (preferably technical docs/tutorials).

## Step 1 Verification: Ingest Pipeline (`fetch -> extract -> summarize -> embed -> persist`)

### Test 1.1 - Start scan and persist open-tab records

1. Open extension popup.
2. Click `Start Scan`.
3. Open dashboard.
4. Confirm rows appear with `pending/processing/done/failed/restricted` statuses.

Expected:

- Tab records are created in dashboard.
- Status changes over time (not permanently `pending`).

### Test 1.2 - Successful page analysis

Pick a known public tab (e.g., Spring docs).

Expected:

- Row ends with `done`.
- Summary is populated.
- Export later includes tags/topics and embedding.

### Test 1.3 - Restricted/failed page handling

Keep at least one tab URL likely to fail or be blocked.

Expected:

- Row ends as `failed` or `restricted`.
- Other tabs continue processing (no global stop).

## Step 2 Verification: `ASK_QUERY` Retrieval + Answer

### Test 2.1 - Query after at least 3-5 analyzed rows

Use a topical question, e.g.:

- `Did I save any bookmark about Spring Boot authentication?`

Expected:

- Popup returns an answer (not "not implemented").
- Output includes `matched_urls`.
- Output includes `related_urls` when relevant.

### Test 2.2 - Empty/invalid query handling

Submit empty input.

Expected:

- UI shows validation message (`Enter a question first.` or equivalent).

## Step 3 Verification: Runtime LLM JSON Validation

### Test 3.1 - Normal path

Run analysis and ask query on valid pages.

Expected:

- No crashes due to malformed LLM JSON.
- Parsed summaries and answers populate fields correctly.

### Test 3.2 - Fault injection (optional)

Temporarily break a prompt shape or use a non-JSON prompt response mode.

Expected:

- Pipeline marks failure rather than saving corrupted data.
- Error is surfaced in UI/logs.

## Step 4 Verification: Fixtures + Export + QA Assets

### Test 4.1 - Export JSONL

1. Open dashboard.
2. Click `Export JSONL`.
3. Save file.

Expected:

- `.jsonl` file is downloaded.
- Each line is a valid JSON object.
- `schema_version = bookmark_knowledge.v1`.

### Test 4.2 - Fixture questions coverage

Run sample questions from `docs/testing/SAMPLE_QUERY_FIXTURES.md`.

Expected:

- Technical topical questions return relevant URLs.
- Broader questions return related URLs with weaker confidence.

## Regression Checks

- Re-run `Start Scan` does not duplicate existing open-tab URLs in storage.
- Existing analyzed records remain visible after browser restart.
- Options settings persist after reopening extension options page.
