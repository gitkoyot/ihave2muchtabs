# I Have 2 Much Tabs - Project Specification (As Built)

## 1. Goal

Provide a Chrome-native workflow for reducing open-tab overload without losing knowledge.

The extension captures open tabs, analyzes page content with Azure OpenAI, stores structured knowledge locally, supports semantic Q&A, and provides exports for long-term reuse.

## 2. Scope (Current)

In scope:

- Scan open tabs from all windows or current window.
- Process only `http://` and `https://` URLs.
- Deduplicate by URL within a scan.
- Fetch page HTML and extract readable main text plus links.
- Generate summary artifacts with Azure OpenAI:
  - short summary
  - detailed summary
  - why relevant
  - tags
  - topics
  - technologies
  - embedding vector
- Persist local records in IndexedDB.
- Semantic retrieval + answer generation from analyzed records.
- Export to `JSONL` and `TXT`.
- Optional close of analyzed tabs.

Out of scope:

- Cloud sync / multi-user accounts
- Browser history ingestion
- OCR/PDF extraction
- Full migration framework for DB schema changes
- Automatic remote backup

## 3. Architecture

- MV3 service worker orchestrates scanning, analysis, querying, and exports.
- Popup offers quick actions and status.
- Dashboard provides tabular insight, logs, cost estimate, and maintenance actions.
- Options page manages Azure credentials and processing limits.
- IndexedDB is the durable local store.
- Azure OpenAI chat + embeddings power summarization and semantic Q&A.

## 4. Runtime pipeline

1. User starts scan from popup.
2. `tabScanner` captures open tabs and creates `TabRecord` entries.
3. Background loop marks each tab as `processing`.
4. Page fetch + content extraction runs.
5. LLM summary and embedding are generated.
6. `PageDocument`, `PageLink`, and `PageAnalysis` are persisted.
7. Tab status becomes `done`, `failed`, or `restricted`.

## 5. Data model summary

Core entities:

- `TabRecord`
- `PageDocument`
- `PageLink`
- `PageAnalysis`
- `QueryHistoryRecord`

Status values:

- `pending`
- `processing`
- `done`
- `failed`
- `restricted`

## 6. Integrations and APIs

Chrome APIs used:

- `chrome.tabs`
- `chrome.runtime`
- `chrome.storage`
- `chrome.downloads`

Azure OpenAI settings required:

- endpoint
- API key
- chat deployment
- embeddings deployment
- API version

## 7. Non-functional behavior

- Local-first persistence.
- Bounded analysis concurrency (effective range `1..10`).
- Resilient per-record failure handling.
- Diagnostic logging and estimated token-cost reporting.

## 8. Security and privacy model

- Credentials are stored in local extension storage.
- Page content is sent to user-configured Azure OpenAI endpoint for analysis/query.
- Extension code is packaged locally; no remote code execution.

## 9. Quality and operations notes

- Current DB version: `1`.
- Export schema: `tab_knowledge.v2`.
- Cost estimate is heuristic and should not be treated as billing truth.
