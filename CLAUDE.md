# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chrome Extension (Manifest V3) that converts open browser tabs into a local, AI-searchable knowledge base. Scans tabs, fetches page content, generates summaries and embeddings via LLM providers, stores everything in IndexedDB, and enables semantic Q&A across archived tabs.

## Build & Development Commands

All commands run from `extension/` directory:

```bash
cd extension
npm install          # install dependencies
npm run build        # esbuild bundle (4 entry points → dist/)
npm run watch        # rebuild on file changes
npm run typecheck    # tsc --noEmit (strict mode)
```

Load the extension in Chrome via `chrome://extensions` → "Load unpacked" → select the `extension/` folder.

No test framework is set up yet.

## Project Rules

**Version Bumping:** Every time any change is made to the extension code, bump the revision (patch) version in both `extension/manifest.json` and `extension/package.json` before committing.

## Architecture

### Message-Passing Core

The extension uses Chrome's `runtime.onMessage` for all communication between UI pages and the background service worker:

- **UI pages** (popup, options, dashboard) send typed `RuntimeRequest` messages
- **Service worker** (`src/background/service-worker.ts`) routes messages via `handleMessage()` switch and returns typed `RuntimeResponse`
- Message types are defined in `src/types/messages.ts`
- Helper: `src/utils/runtime.ts` wraps `chrome.runtime.sendMessage`

### Processing Pipeline

```
Popup (START_SCAN) → tabScanner.ts → saveTabRecords()
                                         ↓
                              ensureAnalysisLoop() (bounded concurrency)
                                         ↓
                              pageFetcher.ts → contentExtractor.ts
                                         ↓
                              llmProvider.ts → [azure | anthropic | copilot]
                                         ↓
                              savePageAnalysis() + savePageDocument() + savePageLinks()
```

Status lifecycle per tab: `pending → processing → done | failed | restricted`

### Multi-Provider LLM Abstraction

`src/llm/llmProvider.ts` routes calls based on `settings.provider` and `settings.embeddingProvider`:

- **Chat** (summaries + Q&A): Azure OpenAI, Anthropic Claude, or Copilot/OpenAI-compatible
- **Embeddings** (vector search): Azure OpenAI or Copilot only (Anthropic has no embeddings API)

Each provider has its own client file in `src/llm/`. All share the same prompt templates (`prompts.ts`) and response validators (`validators.ts`).

Settings type is `LlmSettings` with nested provider-specific configs (`azure`, `anthropic`, `copilot`). Legacy `AzureOpenAISettings` are auto-migrated on load in `settings.ts`.

### Storage Layer

- **IndexedDB** via `src/storage/db.ts`: stores `tab_captures`, `page_documents`, `page_analyses`, `page_links`, `query_history`
- **Repository pattern** (`src/storage/repository.ts`): all DB access goes through typed functions like `saveTabRecords()`, `listKnowledgeRows()`
- **chrome.storage.local**: LLM provider credentials and settings (key: `llm_settings`)

### Semantic Search Flow (ASK_QUERY)

1. Embed the question via the configured embedding provider
2. `rankAnalysesBySimilarity()` scores all analyzed pages using cosine similarity (`src/search/vector.ts`)
3. Top 8 results passed as context to the chat provider
4. Response includes answer, matched_urls, related_urls, confidence

### TypeScript Strictness

`tsconfig.json` enables `strict: true`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. The service worker runs in a context without DOM — content extraction uses regex-based HTML stripping, not DOMParser.

### Entry Points (esbuild)

| Entry | HTML | Purpose |
|-------|------|---------|
| `src/background/service-worker.ts` | — | Background orchestrator |
| `src/popup/index.ts` | `popup.html` | Quick scan & Q&A |
| `src/options/index.ts` | `options.html` | Provider settings with tabbed UI |
| `src/dashboard/index.ts` | `dashboard.html` | Analytics, logs, cost, export |
