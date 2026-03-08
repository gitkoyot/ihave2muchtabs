# MVP Implementation Backlog

## Current state

Implemented:

- MV3 extension structure with popup/options/dashboard/background.
- Open-tab scanning with scope and URL deduplication.
- IndexedDB persistence stores and repository layer.
- Analysis loop with bounded concurrency.
- Azure OpenAI integration for summaries and embeddings.
- Semantic Q&A pipeline.
- JSONL/TXT export.
- Dashboard diagnostics, debug logs, and cost estimate panel.
- Optional close-analyzed-tabs workflow.

## Remaining high-value backlog

## 1) Reliability and recoverability

- Persist active scan job metadata in `scan_jobs` and resume more explicitly.
- Add retry policy for transient fetch/network/API failures.
- Add per-record retry action in dashboard.

## 2) Data quality and retrieval quality

- Add lexical + semantic hybrid ranking.
- Improve extraction fallback when readability is weak.
- Add domain-level heuristics for noisy pages.

## 3) UX and safety

- Add filters/search input behavior in dashboard (currently UI has placeholder only).
- Add explicit confirmation summary before bulk close action.
- Add richer status chips/counters in popup.

## 4) Testing and release hardening

- Add unit tests for retrieval ranking, exporter mapping, and validator logic.
- Add integration smoke tests for message handlers.
- Add release checklist for Chrome Web Store policy declarations.

## 5) Security and privacy hardening

- Improve secrets handling guidance and key rotation UX.
- Add optional external local proxy/companion service mode.

## 6) Packaging and store readiness

- Add icon set (`16`, `32`, `48`, `128`) and manifest references.
- Finalize privacy policy URL and CWS permission justifications.
