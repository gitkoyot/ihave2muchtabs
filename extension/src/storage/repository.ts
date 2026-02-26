import type { BookmarkRecord, PageAnalysis } from "../types/models";
import { getAllBookmarkRecords, getAllPageAnalyses, putBookmarkRecord, putPageAnalysis } from "./db";

export async function saveBookmarkRecords(records: BookmarkRecord[]): Promise<void> {
  for (const record of records) {
    await putBookmarkRecord(record);
  }
}

export async function savePageAnalysis(analysis: PageAnalysis): Promise<void> {
  await putPageAnalysis(analysis);
}

export async function listKnowledgeRows(): Promise<
  Array<{ bookmark: BookmarkRecord; analysis: PageAnalysis | null }>
> {
  const [bookmarks, analyses] = await Promise.all([getAllBookmarkRecords(), getAllPageAnalyses()]);
  const analysesByRecordId = new Map(analyses.map((a) => [a.recordId, a]));
  return bookmarks.map((bookmark) => ({
    bookmark,
    analysis: analysesByRecordId.get(bookmark.id) ?? null
  }));
}

