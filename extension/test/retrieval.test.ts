import { describe, expect, it } from "vitest";
import { rankAnalysesBySimilarity } from "../src/search/retrieval";
import type { PageAnalysis } from "../src/types/models";

function makeAnalysis(id: string, embedding: number[]): PageAnalysis {
  return {
    id,
    recordId: `record-${id}`,
    documentId: `doc-${id}`,
    pageTitle: `Page ${id}`,
    finalUrl: `https://example.com/${id}`,
    httpStatus: 200,
    fetchStatus: "ok",
    contentHash: null,
    summaryShortEn: "short",
    summaryDetailedEn: "detailed",
    whyRelevantEn: "relevant",
    tags: [],
    topics: [],
    technologies: [],
    extractedLinks: [],
    embedding,
    modelChat: "chat",
    modelEmbedding: "embed",
    promptVersion: "v1",
    tokenUsageIn: null,
    tokenUsageOut: null,
    analysisVersion: 1,
    createdAt: 1
  };
}

describe("rankAnalysesBySimilarity", () => {
  it("sorts descending by cosine similarity and enforces topK", () => {
    const analyses = [
      makeAnalysis("best", [1, 0]),
      makeAnalysis("second", [0.5, 0.5]),
      makeAnalysis("opposite", [-1, 0])
    ];

    const ranked = rankAnalysesBySimilarity([1, 0], analyses, 2);

    expect(ranked.map((row) => row.analysis.id)).toEqual(["best", "second"]);
  });

  it("filters out negative similarity scores", () => {
    const ranked = rankAnalysesBySimilarity([1, 0], [makeAnalysis("opposite", [-1, 0])]);
    expect(ranked).toEqual([]);
  });
});
