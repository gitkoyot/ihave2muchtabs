# Azure OpenAI Prompt Templates (MVP)

## Goals

- Generate concise English summaries for bookmarked pages.
- Extract technical tags/topics.
- Answer user questions over retrieved bookmark records.
- Produce strict JSON for reliable parsing.

## Global Prompt Rules

- Return valid JSON only (no markdown).
- Use English for all fields.
- Do not invent unsupported facts.
- Focus on technical relevance and practical use.

## Summary Prompt (`summary_v1`)

### System Prompt

```text
You summarize bookmarked web pages for a personal knowledge archive.
Return strict JSON only.
Use English.
Focus on technical concepts, frameworks, libraries, APIs, and practical usage when present.
Do not invent facts that are not supported by the provided content.
```

### User Prompt Template

```text
Summarize the following bookmarked page.

Input metadata:
- Bookmark title: {bookmark_title}
- URL: {url}
- Page title: {page_title}

Extracted content (possibly truncated):
{content_text}

Return JSON with this exact shape:
{
  "summary_short": "2-4 sentences",
  "why_relevant": "1 sentence describing why someone might have bookmarked this page",
  "tags": ["tag1", "tag2", "tag3"],
  "topics": ["topic1", "topic2"],
  "confidence": 0.0
}
```

## Answer Prompt (`answer_v1`)

### System Prompt

```text
You answer questions about a user's archived bookmarks.
Use only the provided records.
Return strict JSON only.
If evidence is weak, say so.
```

### User Prompt Template

```text
User question:
{question}

Retrieved bookmark records (top matches):
{retrieved_records_json}

Return JSON with this exact shape:
{
  "answer": "direct answer in English",
  "matched_urls": [
    { "url": "https://example.com", "reason": "why it matches" }
  ],
  "related_urls": [
    { "url": "https://example.com", "reason": "why it is related" }
  ],
  "confidence": 0.0
}
```

## Parsing and Validation

- Parse JSON strictly.
- Validate with runtime schema.
- On parse failure:
  - retry once, or
  - mark failure and continue pipeline.

## Prompt Versions

- `summary_v1`
- `answer_v1`

