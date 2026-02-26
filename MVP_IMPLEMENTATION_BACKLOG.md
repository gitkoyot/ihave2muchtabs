# MVP Implementation Backlog (Plugin-Only)

## Assumptions

- Architecture: Chrome Extension (Manifest V3) only, no local companion service for MVP.
- AI provider: Azure OpenAI (user-provided endpoint, key, deployments).
- Scale: 200-300 open tabs.
- Output language: English summaries and answers.

## Delivery Strategy

- Phase 1: Working ingestion pipeline for a subset of open tabs.
- Phase 2: Persistent local knowledge base + semantic search.
- Phase 3: Ask UI + answer generation.
- Phase 4: Export + cleanup workflow.

## Sprint 1: Foundation (Extension Skeleton + Settings)

### Goals

- Create buildable MV3 extension skeleton in TypeScript.
- Add settings UI for Azure OpenAI configuration.
- Establish message passing and local storage shape.

### Tasks

1. Project scaffold
- Create `extension/` with MV3 manifest and TS source layout.
- Add build config (`esbuild` scripts).
- Add popup/options/dashboard HTML shells.

2. Shared types and messaging
- Define bookmark, analysis, query, and job status models.
- Define runtime message contracts.

3. Settings storage
- Implement `chrome.storage.local` wrapper for Azure settings and limits.
- Add settings validation UI.

4. Background worker bootstrap
- Add startup hooks and basic handlers:
  - `GET_STATUS`
  - `START_SCAN`
  - `GET_STATS`

### Acceptance Criteria

- Extension loads in Chrome as unpacked extension.
- Options page can save/load Azure settings.
- Popup can request background status.

## Sprint 2: Open Tabs Ingestion + Local Persistence

### Goals

- Read open tabs from Chrome.
- Build processing queue.
- Persist bookmark records and statuses in IndexedDB.

### Tasks

1. Open tab scanner
- Read open tabs via `chrome.tabs.query`.
- Preserve source window metadata.
- Skip unsupported URLs.
- Deduplicate URLs.

2. IndexedDB schema and repository layer
- Create stores:
  - `bookmark_records`
  - `page_analyses`
  - `processing_jobs`
  - `query_history` (optional)

3. Job orchestration in background worker
- Queue model (`pending`, `processing`, `done`, `failed`, `restricted`)
- Resumable job state
- Bounded concurrency

4. Basic dashboard list view
- Show counts and per-item status.

### Acceptance Criteria

- Open tabs are ingested and stored.
- Duplicate URLs are not processed twice.
- Status persists after extension reload.

## Sprint 3: Fetch + Extract + Azure OpenAI Summaries/Embeddings

### Goals

- Analyze pages and populate summaries/tags/embeddings.

### Tasks

1. Page fetcher with timeout/retry
2. Content extraction and truncation
3. Azure OpenAI client (chat + embeddings)
4. Structured JSON parsing/validation
5. Analysis persistence and failure classification

### Acceptance Criteria

- At least 10 open tabs can be analyzed end-to-end.
- Successful records include summary, tags, and embedding.

## Sprint 4: Semantic Search + Ask UX

### Goals

- Natural-language query over archived bookmarks.

### Tasks

1. Local vector similarity search (cosine)
2. Top-K retrieval context builder
3. Azure OpenAI answer generation
4. Ask UI in popup/dashboard
5. Related bookmarks view

### Acceptance Criteria

- User can ask a Spring-related question and receive URL-backed tab results.

## Sprint 5: Export + Cleanup Support

### Goals

- Export knowledge base and support manual bookmark cleanup.

### Tasks

1. JSONL export
2. Optional Markdown export
3. `Safe to delete` visual state
4. Usage/privacy docs and warnings

### Acceptance Criteria

- User can export `JSONL`.
- User can identify analyzed tabs and manually close them safely.

## Cross-Cutting Tasks

1. Diagnostics and error codes
2. Cost controls (max chars, max pages, domain filters)
3. Unit tests (scanner, cosine, export, parser)
4. Manual QA checklist for extension flows
