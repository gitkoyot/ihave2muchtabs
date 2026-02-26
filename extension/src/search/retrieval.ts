import type { PageAnalysis } from "../types/models";
import { cosineSimilarity } from "./vector";

export function rankAnalysesBySimilarity(
  queryEmbedding: number[],
  analyses: PageAnalysis[],
  topK = 8
): Array<{ analysis: PageAnalysis; score: number }> {
  return analyses
    .map((analysis) => ({ analysis, score: cosineSimilarity(queryEmbedding, analysis.embedding) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

