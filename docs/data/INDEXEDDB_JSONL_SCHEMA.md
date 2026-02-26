# IndexedDB and JSONL Schema (MVP)

## Purpose

Define the local storage model (IndexedDB) and export format (`JSONL`) for the plugin-only MVP.
Current schema is open-tabs-first and uses dedicated domain stores.

## Design Principles

- Store only what is needed for semantic recall.
- Do not store full page text by default.
- Keep records versioned for migration.
- Keep export AI-friendly.

## IndexedDB Database

- Name: `iHave2MuchTabsKnowledgeDb`
- Version: `1`

## Object Stores

### `tab_captures`

Fields:

- `id`
- `bookmarkId`
- `url`
- `bookmarkTitle`
- `folderPath`
- `dateAdded`
- `processingStatus` (`pending|processing|done|failed|restricted`)
- `lastProcessedAt`
- `createdAt`
- `updatedAt`

Indexes:

- `by_url` (unique)
- `by_status`
- `by_folder`
- `by_updated_at`

### `page_documents`

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
- `whyRelevantEn`
- `tags[]`
- `topics[]`
- `embedding[]`
- `modelChat`
- `modelEmbedding`
- `promptVersion`
- `tokenUsageIn`
- `tokenUsageOut`
- `analysisVersion`
- `createdAt`

Indexes:

- `by_record_id` (unique for MVP)
- `by_final_url`
- `by_fetch_status`
- `by_tags` (multiEntry)
- `by_topics` (multiEntry)

### `processing_jobs`
Store name in current schema: `scan_jobs`.

Fields:

- `id`
- `name`
- `selectedFolderIds[]`
- `status`
- `totalItems`
- `completedItems`
- `failedItems`
- `restrictedItems`
- `startedAt`
- `finishedAt`
- `lastHeartbeatAt`

### `query_history` (optional)

Fields:

- `id`
- `queryText`
- `answerText`
- `matchedRecordIds[]`
- `relatedRecordIds[]`
- `createdAt`

## JSONL Export

## File Naming

- `bookmark-knowledge-export-YYYYMMDD-HHMMSS.jsonl`

## Record Strategy

- One line = one analyzed bookmark.
- Default export = `processingStatus = done`.
- Optional future setting: include failed/restricted rows.

## JSONL Record Schema (v2)

```json
{
  "schema_version": "tab_knowledge.v2",
  "exported_at": "2026-02-26T12:00:00.000Z",
  "record": {
    "id": "rec_123",
    "tab_id": "456",
    "url": "https://docs.spring.io/...",
    "tab_title": "Spring Security Authentication",
    "source_window_id": 123,
    "source_window_label": "Window 123",
    "captured_at": 1730000000000
  },
  "analysis": {
    "page_title": "Authentication :: Spring Security",
    "final_url": "https://docs.spring.io/...",
    "http_status": 200,
    "fetch_status": "ok",
    "content_hash": "sha256:...",
    "summary_short_en": "Overview of Spring Security authentication mechanisms...",
    "why_relevant_en": "Useful reference for configuring authentication flows in Spring Boot apps.",
    "tags": ["spring", "spring-security", "authentication"],
    "topics": ["spring-boot", "security", "auth"],
    "embedding": [0.1, 0.2, 0.3],
    "model_chat": "gpt-4.1-mini",
    "model_embedding": "text-embedding-3-large",
    "prompt_version": "summary_v1",
    "token_usage_in": 1450,
    "token_usage_out": 180,
    "analyzed_at": "2026-02-26T12:01:22.000Z"
  }
}
```

## Notes

- Embeddings are included by default for easier re-import and retrieval.
- Add an `include_embeddings` export option later if file size becomes an issue.
