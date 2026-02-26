import type { PageAnalysis, TabRecord } from "../types/models";

export interface ExportRow {
  schema_version: "tab_knowledge.v2";
  exported_at: string;
  record: {
    id: string;
    tab_id: string;
    url: string;
    tab_title: string;
    source_window_id: number | null;
    source_window_label: string;
    captured_at: number;
  };
  analysis: {
    page_title: string;
    final_url: string;
    http_status: number | null;
    fetch_status: string;
    content_hash: string | null;
    summary_short_en: string;
    summary_detailed_en: string;
    why_relevant_en: string;
    tags: string[];
    topics: string[];
    extracted_links: string[];
    embedding: number[];
    model_chat: string;
    model_embedding: string;
    prompt_version: string;
    token_usage_in: number | null;
    token_usage_out: number | null;
    analyzed_at: string;
  };
}

export function toExportRow(
  tab: TabRecord,
  analysis: PageAnalysis,
  exportedAtIso: string
): ExportRow {
  return {
    schema_version: "tab_knowledge.v2",
    exported_at: exportedAtIso,
    record: {
      id: tab.id,
      tab_id: tab.tabId,
      url: tab.url,
      tab_title: tab.tabTitle,
      source_window_id: tab.sourceWindowId,
      source_window_label: tab.sourceWindowLabel,
      captured_at: tab.capturedAt
    },
    analysis: {
      page_title: analysis.pageTitle,
      final_url: analysis.finalUrl,
      http_status: analysis.httpStatus,
      fetch_status: analysis.fetchStatus,
      content_hash: analysis.contentHash,
      summary_short_en: analysis.summaryShortEn,
      summary_detailed_en: analysis.summaryDetailedEn ?? "",
      why_relevant_en: analysis.whyRelevantEn,
      tags: analysis.tags,
      topics: analysis.topics,
      extracted_links: analysis.extractedLinks ?? [],
      embedding: analysis.embedding,
      model_chat: analysis.modelChat,
      model_embedding: analysis.modelEmbedding,
      prompt_version: analysis.promptVersion,
      token_usage_in: analysis.tokenUsageIn,
      token_usage_out: analysis.tokenUsageOut,
      analyzed_at: new Date(analysis.createdAt).toISOString()
    }
  };
}

export function toJsonl(rows: ExportRow[]): string {
  return rows.map((r) => JSON.stringify(r)).join("\n");
}
