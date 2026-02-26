import type { PageAnalysis, QueryHistoryRecord, TabRecord } from "../types/models";
import {
  clearAllDatabaseStores,
  getAllQueryHistoryRecords,
  getAllPageAnalyses,
  getAllTabRecords,
  putPageAnalysis,
  putPageDocument,
  putQueryHistoryRecord,
  putTabRecord,
  replacePageLinksForDocument
} from "./db";

export async function saveTabRecords(records: TabRecord[]): Promise<void> {
  const existing = await getAllTabRecords();
  const existingUrls = new Set(existing.map((r) => r.url));
  for (const record of records) {
    if (existingUrls.has(record.url)) {
      continue;
    }
    await putTabRecord(record);
    existingUrls.add(record.url);
  }
}

export async function saveTabRecord(record: TabRecord): Promise<void> {
  await putTabRecord(record);
}

export async function savePageAnalysis(analysis: PageAnalysis): Promise<void> {
  await putPageAnalysis(analysis);
}

export async function savePageDocument(input: {
  id: string;
  canonicalUrl: string;
  contentHash: string | null;
  seenAt: number;
}): Promise<void> {
  const domain = safeDomain(input.canonicalUrl);
  await putPageDocument({
    id: input.id,
    canonicalUrl: input.canonicalUrl,
    domain,
    contentHash: input.contentHash,
    firstSeenAt: input.seenAt,
    lastSeenAt: input.seenAt
  });
}

export async function savePageLinks(documentId: string, links: string[]): Promise<void> {
  await replacePageLinksForDocument(documentId, links);
}

export async function listKnowledgeRows(): Promise<
  Array<{ tab: TabRecord; analysis: PageAnalysis | null }>
> {
  const [tabs, analyses] = await Promise.all([getAllTabRecords(), getAllPageAnalyses()]);
  const analysesByRecordId = new Map(analyses.map((a) => [a.recordId, a]));
  return tabs.map((tab) => ({
    tab,
    analysis: analysesByRecordId.get(tab.id) ?? null
  }));
}

export async function listTabRecords(): Promise<TabRecord[]> {
  return await getAllTabRecords();
}

export async function listPageAnalyses(): Promise<PageAnalysis[]> {
  return await getAllPageAnalyses();
}

export async function clearKnowledgeBase(): Promise<void> {
  await clearAllDatabaseStores();
}

export async function saveQueryHistoryRecord(record: QueryHistoryRecord): Promise<void> {
  await putQueryHistoryRecord(record);
}

export async function listQueryHistoryRecords(): Promise<QueryHistoryRecord[]> {
  return await getAllQueryHistoryRecords();
}

function safeDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}
