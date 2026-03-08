# I Have 2 Much Tabs Extension

Chrome Extension (MV3) that scans open tabs, builds local AI knowledge records, and supports semantic Q&A.

## Status

This is a working MVP implementation (not only a skeleton).

## Build

```bash
npm install
npm run typecheck
npm run build
```

Load `extension/` as unpacked in Chrome.

## Runtime components

- `src/background/service-worker.ts`: orchestration, pipeline, exports, ask flow.
- `src/popup/index.ts`: scan/start/ask/export/close controls and live status.
- `src/dashboard/index.ts`: records table, diagnostics, logs, cost panel, DB clear, exports.
- `src/options/index.ts`: Azure settings and processing limits.

## Implemented feature set

- Open-tab scan (`all_tabs` or `current_window`)
- URL deduplication
- Page fetch and extraction
- Azure summary + embedding generation
- Semantic retrieval + answer generation
- IndexedDB persistence
- JSONL and TXT export
- Optional close analyzed tabs
