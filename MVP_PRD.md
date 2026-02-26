# MVP PRD - I Have 2 Much Tabs

## 1. Product Overview

`I Have 2 Much Tabs` is a Chrome extension that helps users delete bookmarks without losing the knowledge contained in them.

Instead of keeping hundreds of bookmarks, users can build a local AI-searchable knowledge base that stores:

- bookmark URL and metadata,
- short English summaries,
- tags/topics,
- semantic embeddings for retrieval.

Users can later ask questions like:

- "Did I ever save a bookmark about Spring?"
- "Show me bookmarks related to Spring Boot authentication."

and get URL-backed answers.

## 2. Problem Statement

Users collect many bookmarks as a "future reading" or "knowledge backup" system, but over time:

- bookmark lists become too large to manage,
- folder organization becomes unreliable,
- users forget what they saved and why,
- searching by title/URL is not enough.

The result is clutter and low confidence when deleting bookmarks.

## 3. MVP Goal

Enable a user with 200-300 bookmarks to:

1. Analyze bookmarks in selected folders.
2. Build a local searchable knowledge base (English summaries + tags + embeddings).
3. Ask natural-language questions and retrieve relevant bookmarks with URLs.
4. Safely delete bookmarks after the knowledge has been preserved.

## 4. Target User (MVP)

### Primary User

Individual technical user (developer/engineer) who:

- has 200-300 bookmarks,
- often saves documentation/tutorial/reference pages,
- wants to reduce bookmark clutter,
- still wants semantic recall of previously saved content.

## 5. User Jobs To Be Done

- "When I want to clean up bookmarks, I want a knowledge backup so I can delete them safely."
- "When I vaguely remember a topic (e.g., Spring auth), I want the system to find related saved URLs."
- "When I ask a question in natural language, I want results with evidence (URLs and short explanations)."

## 6. Success Criteria (MVP)

### User Outcome Metrics

- User can analyze at least 200 bookmarks in one workspace.
- User receives semantically relevant results for topic-based questions (e.g., "Spring", "OAuth", "JWT").
- User can identify and delete bookmarks after archiving with confidence.

### Product/Technical Metrics

- >= 80% of public bookmarks processed successfully (non-login-protected pages).
- Query response returns top relevant URLs in under 5 seconds (for local index search + answer generation may vary by LLM latency).
- Export file (`JSONL`) can be generated for the full workspace.

## 7. MVP Scope

## 7.1 In Scope

### A. Bookmark Import and Selection
- Read Chrome bookmarks via `chrome.bookmarks`.
- Display folders and bookmark counts.
- Allow selecting all bookmarks or selected folders.
- Skip unsupported URL schemes.

### B. Bookmark Analysis Pipeline
- Fetch page content (best effort).
- Extract main readable text.
- Generate English summary.
- Generate tags/topics.
- Generate embedding vector.
- Store results locally.

### C. Local Knowledge Base
- Store bookmark records, processing status, summaries, tags, embeddings.
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

### F. Bookmark Cleanup Support
- Mark records as analyzed / safe to delete.
- Provide visible status so user can manually delete bookmarks in Chrome.

## 7.2 Out of Scope (MVP)

- Multi-user accounts or cloud sync
- Server backend deployment
- Automatic bookmark deletion in bulk (may be risky; defer)
- Browser history ingestion (`chrome.history`)
- Full-page snapshots / HTML archiving
- OCR / PDFs / files behind auth
- Advanced clustering dashboards

## 8. Key User Flows (MVP)

## 8.1 Flow 1: Build Knowledge Base from Bookmarks

1. User opens extension.
2. User configures Azure OpenAI settings in Options.
3. User selects bookmark folder(s).
4. User clicks `Analyze`.
5. Extension processes bookmarks and shows progress.
6. User sees completed records with summaries and statuses.

## 8.2 Flow 2: Ask About Past Bookmarks

1. User opens extension search/ask UI.
2. User asks: "Did I ever save something about Spring Boot auth?"
3. Extension retrieves top semantic matches.
4. LLM returns a concise answer with URLs and short evidence.
5. User opens one of the URLs or uses the summary.

## 8.3 Flow 3: Clean Up Bookmarks

1. User filters for `Analyzed` or `Safe to delete`.
2. User verifies summary and URLs.
3. User deletes corresponding bookmarks in Chrome manually.
4. Knowledge remains available in the local index and export file.

## 9. Functional Requirements (Product-Level)

## 9.1 Bookmark Management

- The extension must read Chrome bookmark folders and URLs.
- The extension must preserve source folder path metadata.
- The extension should deduplicate repeated URLs.
- The extension must show processing state per bookmark.

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

- `chrome.bookmarks`
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
2. User can select bookmark folders and start analysis.
3. The extension processes ~200-300 bookmarks with persistent status tracking.
4. For successfully processed bookmarks, the extension stores:
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
7. User can identify which bookmarks are safe to delete based on analysis status.

## 15. Post-MVP Product Direction (Optional)

- Automatic bookmark deletion workflow (with confirmation and recovery log)
- Topic clustering and collections
- "Show me what I know about X" dashboards
- Cross-device sync
- Local companion service for stronger credential handling

