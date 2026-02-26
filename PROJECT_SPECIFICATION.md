# I Have 2 Much Tabs - Project Specification (Open Tabs MVP)

## 1. Project Goal

Build a Chrome-based tool that lets the user close/delete open tabs while preserving the knowledge contained in them.

The system should:

- read currently open Chrome tabs,
- analyze open tab pages,
- generate English summaries and tags,
- store a searchable local knowledge base,
- answer semantic questions such as:
- "Did I have an open tab about Spring?"
- "Show me tabs related to Spring Boot authentication."

## 2. Confirmed Requirements (from user)

- Primary goal: reduce open-tab clutter while retaining knowledge.
- Scale: about 200-300 open tabs.
- Summary language: English.
- Preferred form: Chrome plugin/extension.
- Stored data: URL + metadata (with summary/tags/embeddings for retrieval).
- LLM provider: Azure OpenAI (endpoint + API key).

## 3. Product Scope

### MVP Scope

1. Read open tabs from Chrome.
2. Let user select tabs/windows.
3. Analyze each open tab page.
4. Generate English summary + tags + embeddings.
5. Store records locally.
6. Support semantic query over archived tab knowledge.
7. Return matched URLs and related tabs.
8. Export data to `JSONL` (and optionally `Markdown`).

### Post-MVP Scope

- Topic clustering (Spring, Auth, DevOps, etc.)
- Better dashboard and filtering
- Re-analysis for changed pages
- `DOCX` export
- Optional local companion service for better key security

## 4. Recommended Architecture

## 4.1 MVP (Plugin-First)

Chrome Extension (Manifest V3) with local storage:

- `Popup UI` for quick actions and search
- `Options Page` for Azure OpenAI settings
- `Background Service Worker` for orchestration
- `Tab Scanner` (`chrome.tabs`)
- `Page Fetch + Content Extraction`
- `Azure OpenAI Client` (summary + embeddings)
- `IndexedDB` local knowledge store
- `Semantic Search Layer`
- `Export Module` (`JSONL`, optional `Markdown`)

## 4.2 Future (Plugin + Local Companion Service)

Add a local desktop process (small local API service) that:

- stores Azure OpenAI API key outside the extension,
- performs LLM calls,
- optionally handles crawling/extraction/retries more reliably,
- exposes a local API consumed by the extension.

This keeps the browser extension UX while improving security and maintainability.

## 5. Functional Requirements

## 5.1 Open Tab Ingestion

- Read currently open tabs (title, URL, window id, tab id).
- Allow user to select:
  - all open tabs,
  - current window,
  - multiple windows (future UI)
- Deduplicate identical URLs across tabs/windows.
- Preserve source window metadata.

## 5.2 Page Analysis

- Support `http://` and `https://` URLs.
- Skip unsupported URLs (`chrome://`, `about:`, `javascript:`).
- Detect and record fetch failures (`404`, `403`, timeout, SSL).
- Mark login-required pages as `restricted` when content cannot be analyzed.
- Extract main page text (boilerplate reduction).
- Limit text length sent to LLM to control cost.

## 5.3 LLM Processing (Azure OpenAI)

- Generate English summaries.
- Generate tags/topics in English.
- Generate embeddings for semantic search.
- Use structured output (JSON) for predictable parsing.

## 5.4 Search and Q&A

- Search by URL, title, tags, and semantic similarity.
- Answer natural-language questions using top matching records.
- Return matched URLs and related bookmarks.

## 5.5 Export

- Export knowledge records to `JSONL` as the canonical format.
- Optional `Markdown` export for human-readable backup.

## 6. Non-Functional Requirements

## 6.1 Privacy

- Default to storing:
  - URL,
  - titles,
  - folder path,
  - summary,
  - tags/topics,
  - embeddings,
  - processing status.
- Do not store full page text by default.
- Inform user that page content is sent to Azure OpenAI during analysis.

## 6.2 Security

- MVP plugin-only: local storage of Azure OpenAI credentials (personal use, explicit warning).
- Future version: move credentials to a local companion service.

## 6.3 Reliability

- Retry transient failures with backoff.
- Resume interrupted runs.
- Track per-bookmark processing status.

## 6.4 Performance

- Handle 200-300 bookmarks in a single workspace.
- Limit concurrency (e.g., 2-5 parallel analyses).

## 6.5 Cost Control

- Configurable text limits per page.
- Optional skip for oversized pages.
- Token usage reporting per run (estimated or actual).

## 7. Data Model (MVP)

## 7.1 `BookmarkRecord`

Note: in the current MVP code this model is reused for open tab snapshots (legacy naming kept temporarily to avoid schema churn).

- `id`
- `bookmarkId`
- `url`
- `bookmarkTitle`
- `folderPath`
- `dateAdded`
- `processingStatus` (`pending|processing|done|failed|restricted`)
- `lastProcessedAt`

## 7.2 `PageAnalysis`

- `recordId`
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
- `tokenUsageIn`
- `tokenUsageOut`
- `createdAt`

## 8. Semantic Retrieval Strategy

### Why summaries + embeddings are required

Storing only URL + metadata is not enough for semantic recall questions such as:

- "Did I have an open tab about Spring Boot auth?"

To support this, the system needs:

- concise summaries,
- tags/topics,
- embeddings for semantic similarity search.

This still preserves a privacy-first design because full page text does not need to be stored by default.

## 9. Azure OpenAI Integration Requirements

User-configurable settings (in extension options):

- `Azure OpenAI Endpoint`
- `API Key`
- `Chat Deployment Name`
- `Embeddings Deployment Name`
- `API Version`

LLM tasks:

- summary generation
- tagging/topic extraction
- embedding generation
- final answer generation over top-K matched bookmark records

## 10. Suggested Repository Structure (English)

```text
ihave2muchtabs/
  extension/
    manifest.json
    src/
      popup/
      options/
      dashboard/
      background/
      bookmarks/
      fetcher/
      extractor/
      llm/
      storage/
      search/
      export/
      types/
  docs/
    architecture/
    prompts/
  PROJECT_SPECIFICATION.md
  MVP_PRD.md
```

## 11. Delivery Roadmap (High Level)

### Phase 1: PoC

- Open tabs read
- Single-page analysis
- Azure OpenAI summary + embedding
- Local storage proof

### Phase 2: MVP

- Batch processing (200-300 bookmarks)
- Resume/retry
- Semantic search and Q&A
- JSONL export

### Phase 3: UX Improvements

- Better dashboard
- Related bookmarks
- "Safe to delete" workflow

### Phase 4: Security Hardening (Optional)

- Local companion service
