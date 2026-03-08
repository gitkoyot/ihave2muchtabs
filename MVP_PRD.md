# MVP PRD - I Have 2 Much Tabs

## 1. Product statement

`I Have 2 Much Tabs` helps users safely reduce open-tab clutter by preserving the useful knowledge from those tabs in a local AI-searchable archive.

## 2. Target user

Primary user is an individual power browser user (developer/research-heavy user) with many open tabs who wants confidence before closing them.

## 3. MVP jobs-to-be-done

- Build a recoverable knowledge snapshot from open tabs.
- Ask semantic questions about previously open pages.
- Export knowledge into reusable machine-friendly formats.
- Close analyzed tabs after preserving context.

## 4. Functional requirements (MVP)

- Capture open tabs with scope selection (`all_tabs`, `current_window`).
- Persist processing status per tab.
- Analyze page content using Azure OpenAI (summary + embedding).
- Support semantic Q&A with URL-backed results.
- Export analyzed records as `JSONL` and `TXT`.
- Allow optional closing of analyzed tabs.

## 5. Success criteria

- User can process a realistic tab set (200+ tabs in multiple runs).
- User receives relevant URL-backed answers for topical questions.
- User can export analyzed knowledge without data loss.
- User can reduce active tab count with confidence.

## 6. Non-functional requirements

- Local persistence and recovery across extension restarts.
- Graceful handling of blocked/restricted pages.
- Bounded concurrency and configurable character limits.
- Clear diagnostics for failures and processing progress.

## 7. Risks

- Restricted pages lower analysis coverage.
- LLM cost variability.
- Credential handling in extension local storage.

## 8. Mitigations

- Mark records as `restricted`/`failed` with visible status.
- Keep cost controls (`maxCharsPerPage`, concurrency) and token estimate panel.
- Keep scope explicitly personal-use and document local credential model.

## 9. Current delivery state

MVP core loop is implemented and operational:

- scan -> analyze -> persist -> ask -> export -> optional close analyzed tabs
