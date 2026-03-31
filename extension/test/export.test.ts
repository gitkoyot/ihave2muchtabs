import { describe, expect, it } from "vitest";
import { toExportRow, toJsonl } from "../src/export/jsonl";
import { buildLlmFriendlyTxtExport } from "../src/export/txt";
import type { PageAnalysis, TabRecord } from "../src/types/models";

const tab: TabRecord = {
  id: "rec-1",
  tabId: "11",
  url: "https://example.com",
  tabTitle: "Example",
  sourceWindowId: 2,
  sourceWindowLabel: "Window 2",
  capturedAt: 1_700_000_000_000,
  processingStatus: "done",
  lastProcessedAt: 1_700_000_000_100,
  lastErrorMessage: null,
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_100
};

const analysis: PageAnalysis = {
  id: "analysis-1",
  recordId: "rec-1",
  documentId: "doc-1",
  pageTitle: "Example Page",
  finalUrl: "https://example.com/final",
  httpStatus: 200,
  fetchStatus: "ok",
  contentHash: "sha256:abc",
  summaryShortEn: "Short summary",
  summaryDetailedEn: "Detailed summary",
  whyRelevantEn: "Relevant summary",
  tags: ["tag-a", "tag-b"],
  topics: ["topic-a"],
  technologies: ["TypeScript"],
  extractedLinks: ["https://example.com/a"],
  embedding: [0.1, 0.2],
  modelChat: "gpt-test",
  modelEmbedding: "embed-test",
  promptVersion: "summary_v1",
  tokenUsageIn: 10,
  tokenUsageOut: 20,
  analysisVersion: 1,
  createdAt: 1_700_000_000_500
};

describe("export helpers", () => {
  it("maps internal records to export schema", () => {
    const row = toExportRow(tab, analysis, "2026-01-01T00:00:00.000Z");

    expect(row.schema_version).toBe("tab_knowledge.v2");
    expect(row.record.tab_id).toBe("11");
    expect(row.analysis.summary_short_en).toBe("Short summary");
    expect(row.analysis.analyzed_at).toBe("2023-11-14T22:13:20.500Z");
  });

  it("serializes rows as JSONL", () => {
    const row = toExportRow(tab, analysis, "2026-01-01T00:00:00.000Z");
    const jsonl = toJsonl([row, row]);
    expect(jsonl.split("\n")).toHaveLength(2);
    expect(JSON.parse(jsonl.split("\n")[0]).record.id).toBe("rec-1");
  });

  it("builds a readable TXT export for analyzed rows only", () => {
    const txt = buildLlmFriendlyTxtExport(
      [
        { tab, analysis },
        { tab: { ...tab, id: "rec-2", processingStatus: "failed" }, analysis: null }
      ],
      "2026-01-01T00:00:00.000Z"
    );

    expect(txt).toContain("I HAVE 2 MUCH TABS - KNOWLEDGE EXPORT");
    expect(txt).toContain("Analyzed records: 1");
    expect(txt).toContain("## Record 1");
    expect(txt).toContain("Short summary");
    expect(txt).not.toContain("rec-2");
  });

  it("renders empty sections with a stable placeholder", () => {
    const txt = buildLlmFriendlyTxtExport(
      [{ tab, analysis: { ...analysis, tags: [], topics: [], technologies: [], extractedLinks: [] } }],
      "2026-01-01T00:00:00.000Z"
    );

    expect(txt).toContain("Topics:\n- none");
    expect(txt).toContain("Tags:\n- none");
    expect(txt).toContain("Technologies:\n- none");
  });
});
