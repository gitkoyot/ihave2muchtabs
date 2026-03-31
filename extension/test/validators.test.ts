import { describe, expect, it } from "vitest";
import { parseAskAnswerResultJson, parseSummaryResultJson } from "../src/llm/validators";

describe("parseSummaryResultJson", () => {
  it("parses a valid summary payload", () => {
    const result = parseSummaryResultJson(JSON.stringify({
      summary_short: "Short summary",
      summary_detailed: "Detailed summary",
      why_relevant: "Why relevant",
      tags: ["tag-a"],
      topics: ["topic-a"],
      technologies: ["TypeScript"],
      confidence: 0.75
    }));

    expect(result).toEqual({
      summary_short: "Short summary",
      summary_detailed: "Detailed summary",
      why_relevant: "Why relevant",
      tags: ["tag-a"],
      topics: ["topic-a"],
      technologies: ["TypeScript"],
      confidence: 0.75
    });
  });

  it("accepts empty arrays and boundary confidence values", () => {
    expect(parseSummaryResultJson(JSON.stringify({
      summary_short: "Short",
      summary_detailed: "Detailed",
      why_relevant: "Relevant",
      tags: [],
      topics: [],
      technologies: [],
      confidence: 0
    })).confidence).toBe(0);

    expect(parseSummaryResultJson(JSON.stringify({
      summary_short: "Short",
      summary_detailed: "Detailed",
      why_relevant: "Relevant",
      tags: [],
      topics: [],
      technologies: [],
      confidence: 1
    })).confidence).toBe(1);
  });

  it("throws for invalid field types", () => {
    expect(() => parseSummaryResultJson(JSON.stringify({
      summary_short: 1,
      summary_detailed: "Detailed",
      why_relevant: "Relevant",
      tags: [],
      topics: [],
      technologies: [],
      confidence: 0.5
    }))).toThrow("Invalid summary_short");

    expect(() => parseSummaryResultJson(JSON.stringify({
      summary_short: "Short",
      summary_detailed: "Detailed",
      why_relevant: "Relevant",
      tags: ["ok"],
      topics: ["ok"],
      technologies: ["ok"],
      confidence: "bad"
    }))).toThrow("Invalid confidence");
  });

  it("throws for invalid JSON shapes", () => {
    expect(() => parseSummaryResultJson("[]")).toThrow("LLM response is not an object");
    expect(() => parseSummaryResultJson("{bad json")).toThrow();
  });
});

describe("parseAskAnswerResultJson", () => {
  it("parses a valid answer payload", () => {
    const result = parseAskAnswerResultJson(JSON.stringify({
      answer: "Direct answer",
      matched_urls: [{ url: "https://example.com/a", reason: "primary source" }],
      related_urls: [{ url: "https://example.com/b", reason: "related source" }],
      confidence: 0.9
    }));

    expect(result).toEqual({
      answer: "Direct answer",
      matched_urls: [{ url: "https://example.com/a", reason: "primary source" }],
      related_urls: [{ url: "https://example.com/b", reason: "related source" }],
      confidence: 0.9
    });
  });

  it("accepts empty arrays", () => {
    const result = parseAskAnswerResultJson(JSON.stringify({
      answer: "No matches",
      matched_urls: [],
      related_urls: [],
      confidence: 0
    }));

    expect(result.matched_urls).toEqual([]);
    expect(result.related_urls).toEqual([]);
  });

  it("throws for invalid nested url/reason fields", () => {
    expect(() => parseAskAnswerResultJson(JSON.stringify({
      answer: "Answer",
      matched_urls: [{ url: 123, reason: "bad" }],
      related_urls: [],
      confidence: 0.5
    }))).toThrow("Invalid matched_urls.url");

    expect(() => parseAskAnswerResultJson(JSON.stringify({
      answer: "Answer",
      matched_urls: [],
      related_urls: [{ url: "https://example.com", reason: 42 }],
      confidence: 0.5
    }))).toThrow("Invalid related_urls.reason");
  });

  it("throws for missing required top-level fields", () => {
    expect(() => parseAskAnswerResultJson(JSON.stringify({
      matched_urls: [],
      related_urls: [],
      confidence: 0.1
    }))).toThrow("Invalid answer");

    expect(() => parseAskAnswerResultJson(JSON.stringify({
      answer: "Answer",
      matched_urls: [],
      related_urls: []
    }))).toThrow("Invalid confidence");
  });
});
