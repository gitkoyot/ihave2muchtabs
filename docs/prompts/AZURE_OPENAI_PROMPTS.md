# Azure OpenAI Prompt Templates (As Implemented)

This file mirrors `extension/src/llm/prompts.ts`.

## Prompt versions

- Summary prompt version: `summary_v1`
- Answer prompt version: `answer_v1`

## Summary prompt (`summary_v1`)

System intent:

- Summarize bookmarked pages for a personal knowledge archive.
- Return strict JSON.
- Use English.
- Stay grounded in provided content.

User prompt output shape:

```json
{
  "summary_short": "4-6 sentences",
  "summary_detailed": "10-16 sentences with concrete details, architecture-level context, key ideas, and practical takeaways",
  "why_relevant": "1 sentence describing why someone might have bookmarked this page",
  "tags": ["tag1", "tag2", "tag3"],
  "topics": ["topic1", "topic2"],
  "technologies": ["framework/library/language/tool names explicitly mentioned in the page content"],
  "confidence": 0.0
}
```

Additional rules encoded in prompt:

- Be concrete and specific.
- Mention key terms/frameworks/APIs explicitly.
- Avoid generic wording.
- `technologies` must contain only technologies present in source text.

## Answer prompt (`answer_v1`)

System intent:

- Answer using only provided retrieved records.
- Return strict JSON.
- State uncertainty if evidence is weak.

User prompt output shape:

```json
{
  "answer": "direct answer in English",
  "matched_urls": [{"url":"https://example.com","reason":"why it matches"}],
  "related_urls": [{"url":"https://example.com","reason":"why it is related"}],
  "confidence": 0.0
}
```

## Validation expectations

Runtime validators enforce structural correctness for summary and answer payloads before persistence/use.
