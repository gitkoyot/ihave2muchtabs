# MVP PRD - I Have 2 Much Tabs

## 1. Product Overview

`I Have 2 Much Tabs` is a Chrome extension that helps users close/delete open tabs without losing the knowledge contained in them.

Instead of keeping hundreds of bookmarks, users can build a local AI-searchable knowledge base that stores:

- tab URL and metadata,
- short English summaries,
- tags/topics,
- semantic embeddings for retrieval.

Users can later ask questions like:

- "Did I have an open tab about Spring?"
- "Show me tabs related to Spring Boot authentication."

and get URL-backed answers.

## 2. Problem Statement

Users keep many open tabs as a "temporary memory" or "knowledge backup" system, but over time:

- tab counts become too large to manage,
- users forget what was open and why,
- browser performance and focus degrade,
- searching by title/URL is not enough.

The result is clutter and low confidence when deleting bookmarks.

## 3. MVP Goal

Enable a user with 200-300 open tabs to:

1. Analyze currently open tabs (all windows or selected scope).
2. Build a local searchable knowledge base (English summaries + tags + embeddings).
3. Ask natural-language questions and retrieve relevant bookmarks with URLs.
4. Safely close/delete tabs after the knowledge has been preserved.

## 4. Target User (MVP)

### Primary User

Individual technical user (developer/engineer) who:

- has 200-300 open tabs,
- often keeps documentation/tutorial/reference pages open,
- wants to reduce tab clutter,
- still wants semantic recall of previously saved content.

## 5. User Jobs To Be Done

- "When I want to clean up open tabs, I want a knowledge backup so I can close them safely."
- "When I vaguely remember a topic (e.g., Spring auth), I want the system to find related previously-open URLs."
- "When I ask a question in natural language, I want results with evidence (URLs and short explanations)."

## 6. Success Criteria (MVP)

### User Outcome Metrics

- User can analyze at least 200 open tabs in one workspace.
- User receives semantically relevant results for topic-based questions (e.g., "Spring", "OAuth", "JWT").
- User can identify and delete bookmarks after archiving with confidence.

### Product/Technical Metrics

- >= 80% of public open-tab pages processed successfully (non-login-protected pages).
- Query response returns top relevant URLs in under 5 seconds (for local index search + answer generation may vary by LLM latency).
- Export file (`JSONL`) can be generated for the full workspace.

## 7. MVP Scope

## 7.1 In Scope

### A. Open Tab Capture and Selection
- Read open Chrome tabs via `chrome.tabs`.
- Display windows and tab counts.
- Allow selecting all open tabs or selected windows (MVP may start with all tabs).
- Skip unsupported URL schemes.

### B. Tab Analysis Pipeline
- Fetch page content (best effort).
- Extract main readable text.
- Generate English summary.
- Generate tags/topics.
- Generate embedding vector.
- Store results locally.

### C. Local Knowledge Base
- Store tab snapshot records, processing status, summaries, tags, embeddings.
- Support re-opening extension and continuing previous state.

### D. Natural Language Query
- User enters a question in English (or any language; answers generated in English for MVP consistency).
- System retrieves semantically similar bookmark records.
- LLM produces answer with:
  - direct answer,
  - matched URLs,
  - related URLs.

### E. Export / Backup
- Export local knowledge base to `JSONL`.
- Optional `Markdown` export if low effort.

### F. Tab Cleanup Support
- Mark records as analyzed / safe to close.
- Provide visible status so user can manually close tabs in Chrome.

## 7.2 Out of Scope (MVP)

- Multi-user accounts or cloud sync
- Server backend deployment
- Automatic bookmark deletion in bulk (may be risky; defer)
- Browser history ingestion (`chrome.history`)
- Full-page snapshots / HTML archiving
- OCR / PDFs / files behind auth
- Advanced clustering dashboards

## 8. Key User Flows (MVP)

## 8.1 Flow 1: Build Knowledge Base from Open Tabs

1. User opens extension.
2. User configures Azure OpenAI settings in Options.
3. User selects tab scope (all tabs / window scope in later UI).
4. User clicks `Analyze`.
5. Extension processes open tabs and shows progress.
6. User sees completed records with summaries and statuses.

## 8.2 Flow 2: Ask About Previously Open Tabs

1. User opens extension search/ask UI.
2. User asks: "Did I ever save something about Spring Boot auth?"
3. Extension retrieves top semantic matches.
4. LLM returns a concise answer with URLs and short evidence.
5. User opens one of the URLs or uses the summary.

## 8.3 Flow 3: Clean Up Tabs

1. User filters for `Analyzed` or `Safe to close`.
2. User verifies summary and URLs.
3. User closes corresponding tabs in Chrome manually.
4. Knowledge remains available in the local index and export file.

## 9. Functional Requirements (Product-Level)

## 9.1 Open Tab Management

- The extension must read open Chrome tabs and URLs.
- The extension must preserve source window metadata.
- The extension should deduplicate repeated URLs across open tabs.
- The extension must show processing state per captured tab record.

## 9.2 Analysis and Summarization

- The extension must generate summaries in English.
- The extension should generate tags/topics suitable for technical content discovery.
- The extension must handle failures gracefully and preserve error status.
- The extension should support retrying failed items.

## 9.3 Search and Question Answering

- The extension must support semantic retrieval using embeddings.
- The extension must return URL-backed answers (no answer without cited URLs when matches exist).
- The extension should include related bookmarks when confidence is moderate/low.

## 9.4 Data and Export

- The extension must store data locally.
- The extension must export `JSONL` with all analyzed records.
- The export must include enough data for later AI consumption (URL, metadata, summary, tags/topics).

## 10. Non-Functional Requirements (MVP)

## 10.1 Privacy and Data Handling

- Default local storage only (IndexedDB).
- Do not store full extracted page text by default.
- Clearly inform user that page content is sent to Azure OpenAI during analysis.

## 10.2 Security

- Azure OpenAI credentials are stored locally in MVP.
- UI must clearly label this as personal-use / local-only security model.
- Architecture should remain compatible with a future local companion service.

## 10.3 Reliability

- Processing must be resumable after extension restart/interruption.
- Each record must maintain a durable processing status.
- Failures must not corrupt previously analyzed records.

## 10.4 Performance

- The extension should process bookmarks in a queue with bounded concurrency.
- Query retrieval from local index should be fast enough for interactive use.

## 11. Data Model (MVP Product View)

Each analyzed bookmark record should contain:

- `url`
- `bookmark_title`
- `folder_path`
- `page_title`
- `summary_en`
- `why_relevant_en`
- `tags[]`
- `topics[]`
- `embedding`
- `processing_status`
- `analyzed_at`

Optional but useful:

- `http_status`
- `content_hash`
- `token_usage`

## 12. Dependencies and Integrations

## 12.1 Browser APIs

- `chrome.tabs`
- `chrome.storage`
- `chrome.runtime`
- `chrome.downloads` (for export)

## 12.2 AI Provider

Azure OpenAI:

- Chat model deployment (summaries and answers)
- Embeddings deployment (semantic search)

Required user configuration:

- endpoint
- API key
- deployment names
- API version

## 13. Risks and Mitigations

## 13.1 Risk: Weak content extraction

Impact:
- poor summaries, poor retrieval quality

Mitigation:
- use a reliable readability extractor
- fallback extraction modes
- store extraction status

## 13.2 Risk: Login-protected or blocked pages

Impact:
- bookmarks cannot be analyzed automatically

Mitigation:
- mark as `restricted`
- include in UI reports
- allow retry later

## 13.3 Risk: Azure API key exposure in plugin-only MVP

Impact:
- local credential risk

Mitigation:
- clear warning in settings
- recommend personal-use only
- future local companion service support

## 13.4 Risk: Cost growth

Impact:
- unexpected token usage

Mitigation:
- max text size per page
- skip oversized pages
- token usage reporting

## 14. Acceptance Criteria (MVP)

MVP is accepted when all of the following are true:

1. User can configure Azure OpenAI credentials in the extension.
2. User can capture open tabs and start analysis.
3. The extension processes ~200-300 open tabs with persistent status tracking.
4. For successfully processed tab records, the extension stores:
   - URL
   - metadata
   - English summary
   - tags/topics
   - embedding
5. User can ask a natural-language question and get:
   - a direct answer
   - matched URLs
   - related URLs
6. User can export the local knowledge base to `JSONL`.
7. User can identify which tabs are safe to close based on analysis status.

## 15. Post-MVP Product Direction (Optional)

- Automatic bookmark deletion workflow (with confirmation and recovery log)
- Topic clustering and collections
- "Show me what I know about X" dashboards
- Cross-device sync
- Local companion service for stronger credential handling
