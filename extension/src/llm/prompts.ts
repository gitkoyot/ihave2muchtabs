export const PROMPT_VERSIONS = {
  summary: "summary_v1",
  answer: "answer_v1"
} as const;

export const SUMMARY_SYSTEM_PROMPT = [
  "You summarize bookmarked web pages for a personal knowledge archive.",
  "Return strict JSON only.",
  "Use English.",
  "Focus on technical concepts, frameworks, libraries, APIs, and practical usage when present.",
  "Do not invent facts that are not supported by the provided content."
].join(" ");

export function buildSummaryUserPrompt(input: {
  bookmarkTitle: string;
  url: string;
  pageTitle: string;
  contentText: string;
}): string {
  return `Summarize the following bookmarked page.

Input metadata:
- Bookmark title: ${input.bookmarkTitle}
- URL: ${input.url}
- Page title: ${input.pageTitle}

Extracted content (possibly truncated):
${input.contentText}

Return JSON with this exact shape:
{
  "summary_short": "3-5 sentences",
  "summary_detailed": "6-12 sentences with specific details, concepts, and practical takeaways",
  "why_relevant": "1 sentence describing why someone might have bookmarked this page",
  "tags": ["tag1", "tag2", "tag3"],
  "topics": ["topic1", "topic2"],
  "confidence": 0.0
}

Rules:
- Be concrete and specific.
- Mention key terms, frameworks, APIs, and concepts explicitly.
- Avoid generic wording.
`;
}

export const ANSWER_SYSTEM_PROMPT = [
  "You answer questions about a user's archived bookmarks.",
  "Use only the provided records.",
  "Return strict JSON only.",
  "If evidence is weak, say so."
].join(" ");

export function buildAnswerUserPrompt(question: string, retrievedRecordsJson: string): string {
  return `User question:
${question}

Retrieved bookmark records (top matches):
${retrievedRecordsJson}

Return JSON with this exact shape:
{
  "answer": "direct answer in English",
  "matched_urls": [{"url":"https://example.com","reason":"why it matches"}],
  "related_urls": [{"url":"https://example.com","reason":"why it is related"}],
  "confidence": 0.0
}`;
}
