# I Have 2 Much Tabs

`I Have 2 Much Tabs` is a Manifest V3 Chrome extension for converting open tabs into a local, AI-searchable knowledge base.

## Important

This is vibe coded app - please expect everything and nothing

## Current capabilities (as implemented)

- Scans open tabs from all windows or only the current window.
- Supports only `http://` and `https://` tabs.
- Deduplicates tabs by URL at scan time.
- Fetches and extracts page text and links.
- Generates summary, detailed summary, tags, topics, technologies, and embedding through Azure OpenAI.
- Stores records in local IndexedDB and settings in `chrome.storage.local`.
- Supports semantic Q&A over analyzed records (`ASK_QUERY`).
- Exports analyzed knowledge as `JSONL` (`tab_knowledge.v2`) and LLM-friendly `TXT`.
- Shows processing statuses, diagnostics, logs, and estimated token cost.
- Optionally closes already analyzed tabs after user confirmation.

## Tech stack

- Chrome Extension Manifest V3
- TypeScript + esbuild
- IndexedDB (local KB)
- Azure OpenAI (chat + embeddings)

## Local setup

```bash
cd extension
npm install
npm run typecheck
npm run build
```

Load unpacked extension from `extension/` in `chrome://extensions`.

## Required configuration

Set in extension `Options`:

- Azure endpoint
- API key
- Chat deployment
- Embedding deployment
- API version (default in app: `2024-10-21`)
- Max chars per page (default: `12000`)
- Max concurrency (default: `2`)

## Typical flow

1. Open popup.
2. Pick scope (`All Open Tabs` or `Current Window Tabs`).
3. Start scan.
4. Watch progress in popup/dashboard.
5. Ask semantic questions in popup.
6. Export JSONL/TXT when needed.
7. Optionally close analyzed tabs.

## Storage and privacy model

- Local persistence:
  - IndexedDB: tab captures, analyses, page documents/links, query history.
  - `chrome.storage.local`: Azure settings.
- Page content is sent to the user-configured Azure OpenAI endpoint for analysis/query.
- No remote code execution in extension runtime.

## Important limitations

- Login-protected pages may fail or be marked `restricted`.
- Cost panel is an estimate, not billing truth.
- No migration path between future DB schema versions yet.

## Documentation map

- Product memory: `docs/PROJECT_MEMORY.md`
- Schema: `docs/data/INDEXEDDB_JSONL_SCHEMA.md`
- Prompts: `docs/prompts/AZURE_OPENAI_PROMPTS.md`
- Manual QA: `docs/testing/MANUAL_QA_CHECKLIST.md`
