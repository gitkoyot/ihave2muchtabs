# Project Memory

This file is the quick operational memory for the current codebase state.

## Product identity

- Name: `I Have 2 Much Tabs`
- Type: Chrome Extension (Manifest V3)
- Core purpose: turn open tabs into a local searchable AI knowledge base

## Current extension version

- `manifest.json` version: `0.1.13`

## Implemented user-facing features

- Scan open tabs from:
  - all windows
  - current window
- Track processing states:
  - `pending`, `processing`, `done`, `failed`, `restricted`
- Ask natural-language questions over analyzed tabs
- Export analyzed data:
  - JSONL (`tab_knowledge.v2`)
  - TXT (`tab_knowledge.v2-txt`)
- Close analyzed tabs (with confirmation)
- View dashboard with summaries, diagnostics, logs, and estimated token costs
- Clear local database and debug logs from dashboard

## Permissions and why they exist

- `tabs`: scan open tabs, read tab metadata, close analyzed tabs
- `storage`: save extension settings in `chrome.storage.local`
- `downloads`: export JSONL/TXT files
- Host permissions `http://*/*` and `https://*/*`: fetch page content for analysis

## Data flow snapshot

1. Scan open tabs (`tabScanner`).
2. Save tab captures as `pending`.
3. Background loop fetches and extracts each page.
4. Azure OpenAI generates summary + embedding.
5. Persist `page_documents`, `page_links`, `page_analyses`.
6. Mark tab as `done` or `failed/restricted`.
7. `ASK_QUERY` embeds question, ranks by cosine similarity, then calls chat model for final answer JSON.

## Main source files

- Background orchestration: `extension/src/background/service-worker.ts`
- Tab scan: `extension/src/tabs/tabScanner.ts`
- Settings: `extension/src/settings/settings.ts`
- DB schema: `extension/src/storage/db.ts`
- Repository layer: `extension/src/storage/repository.ts`
- Prompt templates: `extension/src/llm/prompts.ts`
- JSONL export: `extension/src/export/jsonl.ts`
- TXT export: `extension/src/export/txt.ts`

## Defaults and operational limits

- API version default: `2024-10-21`
- Max chars per page default: `12000`
- Max concurrency default: `2`
- Runtime concurrency clamp in processing loop: `1..10`
- Fetch timeout per page: `15000 ms`

## Known constraints

- Only `http/https` URLs are analyzed.
- Some pages cannot be fetched due to auth/CORS/protection and are marked `restricted` or `failed`.
- Cost panel is an estimate based on heuristic pricing, not provider billing truth.
- DB schema version is fixed at `1`; no migration utilities yet.
