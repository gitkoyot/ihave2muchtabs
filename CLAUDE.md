# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome/Firefox/Edge Extension (Manifest V3) that converts open browser tabs into a local, AI-searchable knowledge base. Scans tabs, fetches page content, generates summaries and embeddings via LLM providers, stores everything in IndexedDB, and enables semantic Q&A across archived tabs.

## Build & Development Commands

All commands run from `extension/` directory:

```bash
cd extension
npm install              # install dependencies
npm run build            # esbuild bundle for Chrome (4 entry points → dist/)
npm run build:firefox    # build for Firefox
npm run build:all        # build Chrome + Firefox + Edge
npm run watch            # rebuild on file changes (Chrome)
npm run typecheck        # tsc --noEmit (strict mode)
npm run test             # vitest run (all tests)
npx vitest run test/vector.test.ts  # run single test file
npm run package:chrome   # build + ZIP for Chrome
npm run package:firefox  # build + ZIP for Firefox
npm run package:all      # build + ZIP both
```

Load unpacked in Chrome via `chrome://extensions` → select `extension/` folder. For Firefox, use `about:debugging` → "Load Temporary Add-on" → select any file in `extension/.build/firefox/`.

## Project Rules

**Version Bumping:** Every time any change is made to the extension code, bump the revision (patch) version in both `extension/manifest.json` and `extension/package.json` before committing.

## Architecture

### Message-Passing Core

The extension uses Chrome's `runtime.onMessage` for all communication between UI pages and the background service worker:

- **UI pages** (popup, options, dashboard) send typed `RuntimeRequest` messages
- **Service worker** (`src/background/service-worker.ts`) routes messages via `handleMessage()` switch and returns typed `RuntimeResponse`
- Message types are defined in `src/types/messages.ts`
- Helper: `src/utils/runtime.ts` wraps `chrome.runtime.sendMessage`

Responses are either `{ ok: true; type: string; payload: T }` or `{ ok: false; error: string; details?: string }`.

### Cross-Browser Support

Build script (`scripts/build.mjs`) generates browser-specific manifests:
- **Chrome/Edge**: `service_worker` with `type: "module"`
- **Firefox**: `scripts` array + `browser_specific_settings.gecko`

`src/utils/browser-api.ts` exports `api` — resolves `globalThis.browser ?? globalThis.chrome` for cross-browser compatibility. All code uses `api.*` instead of `chrome.*` directly.

### Processing Pipeline

```
Popup (START_SCAN) → tabScanner.ts → saveTabRecords()
                                         ↓
                              ensureAnalysisLoop() (bounded concurrency)
                                         ↓
                              pageFetcher.ts → contentExtractor.ts
                                         ↓
                              llmProvider.ts → [azure | anthropic | ollama]
                                         ↓
                              savePageAnalysis() + savePageDocument() + savePageLinks()
```

Status lifecycle per tab: `pending → processing → done | failed | restricted`

`runtimeStatus` tracks global state: `"idle" | "scanning" | "analyzing_X_tabs" | "waiting_for_settings"`. `activeAnalysisPromise` acts as a mutex to prevent concurrent analysis loops. Worker pool size is `min(10, max(1, settings.maxConcurrency))` (default: 2).

HTTP 401/403 responses produce `"restricted"` status (not a user error). Empty extracted text produces `"failed"`.

`CLOSE_ANALYZED_TABS` (`handleCloseAnalyzedTabs`) closes open http/https tabs whose URL matches a record with `processingStatus === "done"`, scoped to `all_tabs` or `current_window` (the active tab is kept when scoping to the current window). `CLEAR_DATABASE` wipes all IndexedDB stores. `GET_STATS` and `GET_COST_METRICS` aggregate counts and token spend for the dashboard.

### Multi-Provider LLM Abstraction

`src/llm/llmProvider.ts` routes calls based on `settings.provider` and `settings.embeddingProvider`:

- **Chat** (summaries + Q&A): `azure_openai`, `anthropic`, `ollama`
- **Embeddings** (vector search): `azure_openai` or `ollama` only — Anthropic has no embeddings API

Each provider has its own client file in `src/llm/`. All share prompt templates (`prompts.ts`) and strict JSON response validators (`validators.ts`).

Provider utilities in `llmProvider.ts`:
- `checkConnection()` — tests chat + embedding connectivity, returns `{ chat: string; embedding: string }` ("ok" or error)
- `listModels()` — fetches available models from provider (Azure returns placeholder, Anthropic/Ollama query API)

**Ollama note:** Browser extensions need CORS allowed. Ollama must be started with `OLLAMA_ORIGINS="chrome-extension://*"` (or `moz-extension://*` for Firefox). The client auto-detects the correct origin pattern and shows a helpful error on 403.

`LlmSettings` has nested provider-specific configs (`azure`, `anthropic`, `ollama`). Legacy settings are auto-migrated on load in `settings.ts`. Settings stored in `chrome.storage.local` under key `llm_settings`. Defaults: `maxCharsPerPage: 12000`, `maxConcurrency: 2`.

LLM responses are validated to typed shapes:
- **SummaryResult**: `summary_short`, `summary_detailed`, `why_relevant`, `tags[]`, `topics[]`, `technologies[]`, `confidence`
- **AskAnswerResult**: `answer`, `matched_urls[]`, `related_urls[]`, `confidence`

### Storage Layer

**IndexedDB** (`iHave2MuchTabsKnowledgeDb`, v1) via `src/storage/db.ts` with 6 stores:

| Store | Key indices |
|-------|-------------|
| `tab_captures` | `by_url` (unique), `by_status`, `by_window`, `by_updated_at` |
| `page_documents` | `by_canonical_url` (unique), `by_domain`, `by_last_seen_at` |
| `page_analyses` | `by_record_id` (unique), `by_document_id`, `by_final_url`, `by_fetch_status`; multientry: `by_tags`, `by_topics`, `by_technologies` |
| `page_links` | `by_document_id`, `by_to_url` |
| `query_history` | `by_created_at` |
| `scan_jobs` | `by_status`, `by_started_at` |

All DB access goes through typed repository functions in `src/storage/repository.ts` (e.g., `saveTabRecords()`, `listKnowledgeRows()`).

Debug logs are stored in `chrome.storage.local` under `debug_logs` (300-entry circular buffer, scoped by level: debug/info/warn/error).

### Semantic Search Flow (ASK_QUERY)

1. Embed the question via the configured embedding provider
2. `rankAnalysesBySimilarity()` (`src/search/retrieval.ts`) scores all analyzed pages, drops negatives, sorts, and returns the top K (default 8). It delegates the math to `cosineSimilarity()` in `src/search/vector.ts` (which returns `-1` for empty, mismatched, zero-norm, or non-finite vectors).
3. Top 8 results passed as context to the chat provider
4. Response includes answer, matched_urls, related_urls, confidence

### Content Extraction

`src/extractor/contentExtractor.ts` uses **regex-based HTML stripping** (no DOMParser — service workers have no DOM). It removes `<script>`, `<style>`, `<noscript>` tags, decodes HTML entities, extracts the page title from `<title>`, and collects up to 200 links from `<a href>` (excluding fragments, `javascript:`, `mailto:`). Page fetch uses a 15s timeout and tracks the final redirected URL.

### Export & Cost

- **JSONL export** (`src/export/jsonl.ts`): schema `tab_knowledge.v2`, one JSON object per line including embeddings
- **TXT export** (`src/export/txt.ts`): human/LLM-readable with numbered records, sections for summary/topics/tags/technologies/links
- **Cost estimation**: summed token usage across all analyses and queries, priced at $5/M input + $15/M output tokens (Azure OpenAI rates)

### Testing

Vitest with Node environment. Tests in `extension/test/`. Setup file (`test/test-setup.ts`) mocks `chrome`/`browser` APIs globally.

```bash
npm run test                          # all tests
npx vitest run test/vector.test.ts    # single file
npx vitest --coverage                 # with coverage (v8 provider)
```

### TypeScript Strictness

`tsconfig.json` enables `strict: true`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. The service worker runs without DOM — use regex or string operations, not browser APIs like `DOMParser` or `document`.

### UI Style

All pages (popup, options, dashboard) use a consistent dark theme with CSS custom propertie