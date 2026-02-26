import type { BookmarkRecord, PageAnalysis } from "../types/models";

export interface ExportRow {
  schema_version: "bookmark_knowledge.v1";
  exported_at: string;
  record: {
    id: string;
    bookmark_id: string;
    url: string;
    bookmark_title: string;
    folder_path: string;
    date_added: number | null;
  };
  analysis: {
    page_title: string;
    final_url: string;
    http_status: number | null;
    fetch_status: string;
    content_hash: string | null;
    summary_short_en: string;
    why_relevant_en: string;
    tags: string[];
    topics: string[];
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
  bookmark: BookmarkRecord,
  analysis: PageAnalysis,
  exportedAtIso: string
): ExportRow {
  return {
    schema_version: "bookmark_knowledge.v1",
    exported_at: exportedAtIso,
    record: {
      id: bookmark.id,
      bookmark_id: bookmark.bookmarkId,
      url: bookmark.url,
      bookmark_title: bookmark.bookmarkTitle,
      folder_path: bookmark.folderPath,
      date_added: bookmark.dateAdded
    },
    analysis: {
      page_title: analysis.pageTitle,
      final_url: analysis.finalUrl,
      http_status: analysis.httpStatus,
      fetch_status: analysis.fetchStatus,
      content_hash: analysis.contentHash,
      summary_short_en: analysis.summaryShortEn,
      why_relevant_en: analysis.whyRelevantEn,
      tags: analysis.tags,
      topics: analysis.topics,
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

