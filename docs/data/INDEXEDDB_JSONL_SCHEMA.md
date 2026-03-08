# IndexedDB and Export Schema

This document reflects the current implementation in `extension/src/storage/db.ts` and export modules.

## Database

- Name: `iHave2MuchTabsKnowledgeDb`
- Version: `1`

## Object stores

### `tab_captures`

Purpose: open-tab snapshots and processing status.

Fields:

- `id`
- `tabId`
- `url`
- `tabTitle`
- `sourceWindowId`
- `sourceWindowLabel`
- `capturedAt`
- `processingStatus`
- `lastProcessedAt`
- `lastErrorMessage`
- `createdAt`
- `updatedAt`

Indexes:

- `by_url` (unique)
- `by_status`
- `by_window`
- `by_updated_at`

### `page_documents`

Purpose: canonical page identity + content hash timeline.

Fields:

- `id`
- `canonicalUrl`
- `domain`
- `contentHash`
- `firstSeenAt`
- `lastSeenAt`

Indexes:

- `by_canonical_url` (unique)
- `by_domain`
- `by_last_seen_at`

### `page_analyses`

Purpose: AI analysis payload per captured tab record.

Fields:

- `id`
- `recordId`
- `documentId`
- `pageTitle`
- `finalUrl`
- `httpStatus`
- `fetchStatus`
- `contentHash`
- `summaryShortEn`
- `summaryDetailedEn`
- `whyRelevantEn`
- `tags[]`
- `topics[]`
- `technologies[]`
- `extractedLinks[]`
- `embedding[]`
- `modelChat`
- `modelEmbedding`
- `promptVersion`
- `tokenUsageIn`
- `tokenUsageOut`
- `analysisVersion`
- `createdAt`

Indexes:

- `by_record_id` (unique)
- `by_document_id`
- `by_final_url`
- `by_fetch_status`
- `by_tags` (multiEntry)
- `by_topics` (multiEntry)
- `by_technologies` (multiEntry)

### `page_links`

Purpose: normalized outgoing links per document.

Fields:

- `id`
- `documentId`
- `toUrl`
- `createdAt`

Indexes:

- `by_document_id`
- `by_to_url`

### `scan_jobs`

Purpose: reserved store for scan job metadata.

Indexes:

- `by_status`
- `by_started_at`

### `query_history`

Purpose: query/answer history and token usage.

Fields:

- `id`
- `question`
- `answer`
- `matchedUrls[]`
- `relatedUrls[]`
- `modelChat`
- `tokenUsageIn`
- `tokenUsageOut`
- `createdAt`

Index:

- `by_created_at`

## JSONL export

- Trigger: `EXPORT_JSONL`
- Filename pattern: `bookmark-knowledge-export-<ISO timestamp>.jsonl`
- Includes records where tab status is `done` and analysis exists.

Schema version:

- `tab_knowledge.v2`

Per-line object includes:

- `schema_version`
- `exported_at`
- `record` block
- `analysis` block

`analysis` block includes `technologies`, `extracted_links`, and full `embedding` vector.

## TXT export

- Trigger: `EXPORT_TXT`
- Filename pattern: `tab-knowledge-export-<ISO timestamp>.txt`
- Schema marker in file header: `tab_knowledge.v2-txt`
- Includes only analyzed (`done`) records with summaries and metadata in readable sections.
