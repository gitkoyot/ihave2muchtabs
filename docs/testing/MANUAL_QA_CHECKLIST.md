# Manual QA Checklist

Validate end-to-end behavior on a 10-20 tab sample before large runs.

## Preconditions

- Extension is built and loaded unpacked.
- Azure OpenAI settings are configured in Options.
- At least 10 public `http/https` tabs are open.

## 1. Scan and processing pipeline

### 1.1 Start scan

1. Open popup.
2. Choose scope (`All Open Tabs` or `Current Window Tabs`).
3. Click `Start Scan`.
4. Open dashboard.

Expected:

- Rows appear in dashboard.
- Status transitions from `pending` to `processing` and final states.

### 1.2 Verify dedup and unsupported URL skipping

Expected:

- Duplicate URLs are not duplicated in captured records for the same scan.
- Unsupported schemes (`chrome://`, etc.) are ignored.

### 1.3 Validate successful analysis

Expected for done items:

- `summaryShortEn` and `summaryDetailedEn` are visible.
- Topics/tags/technologies are populated.

### 1.4 Validate failure classification

Expected:

- Restricted or blocked pages end as `restricted` or `failed`.
- Other records continue processing.

## 2. Ask flow

### 2.1 Valid semantic query

Use questions from `docs/testing/SAMPLE_QUERY_FIXTURES.md`.

Expected:

- Response contains answer and confidence.
- `matched_urls` and optionally `related_urls` are returned.

### 2.2 Empty query

Expected:

- Popup shows validation message and does not crash.

## 3. Export flow

### 3.1 JSONL export

1. Dashboard -> `Export JSONL`.
2. Save file.

Expected:

- File downloads successfully.
- Each line is valid JSON.
- `schema_version` is `tab_knowledge.v2`.

### 3.2 TXT export

1. Popup or dashboard -> `Export TXT`.

Expected:

- File downloads successfully.
- Header contains `Schema: tab_knowledge.v2-txt`.

## 4. Maintenance actions

### 4.1 Debug logs

- `Load Logs` shows recent entries.
- `Clear Logs` clears panel.

### 4.2 Clear DB

- `Clear DB` removes records and resets dashboard list.

### 4.3 Close analyzed tabs

- Popup -> `Close Analyzed Tabs` after scan.
- In current-window mode, active tab is not closed.

## 5. Persistence regression checks

- Settings persist after extension reload.
- Analyzed rows remain after browser restart.
- Ask still works after reopening popup.
