import { describe, expect, it } from "vitest";
import {
  ANSWER_SYSTEM_PROMPT,
  PROMPT_VERSIONS,
  SUMMARY_SYSTEM_PROMPT,
  buildAnswerUserPrompt,
  buildSummaryUserPrompt
} from "../src/llm/prompts";

describe("prompt helpers", () => {
  it("exposes stable prompt version identifiers", () => {
    expect(PROMPT_VERSIONS).toEqual({
      summary: "summary_v1",
      answer: "answer_v1"
    });
  });

  it("includes the required guidance in the system prompts", () => {
    expect(SUMMARY_SYSTEM_PROMPT).toContain("Return strict JSON only.");
    expect(ANSWER_SYSTEM_PROMPT).toContain("Use only the provided records.");
  });

  it("builds the summary user prompt with all metadata fields", () => {
    const prompt = buildSummaryUserPrompt({
      bookmarkTitle: "Bookmark",
      url: "https://example.com",
      pageTitle: "Example",
      contentText: "Body"
    });

    expect(prompt).toContain("Bookmark title: Bookmark");
    expect(prompt).toContain("URL: https://example.com");
    expect(prompt).toContain('"summary_short"');
    expect(prompt).toContain("technologies");
  });

  it("builds the answer prompt with the question and retrieved records JSON", () => {
    const prompt = buildAnswerUserPrompt("What is this?", '[{"url":"https://example.com"}]');
    expect(prompt).toContain("User question:");
    expect(prompt).toContain("What is this?");
    expect(prompt).toContain('"matched_urls"');
    expect(prompt).toContain('[{"url":"https://example.com"}]');
  });
});
