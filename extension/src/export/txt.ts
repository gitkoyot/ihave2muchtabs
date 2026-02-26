import type { PageAnalysis, TabRecord } from "../types/models";

function safeList(items: string[], max = 20): string {
  if (!items || items.length === 0) {
    return "- none";
  }
  return items.slice(0, max).map((item) => `- ${item}`).join("\n");
}

export function buildLlmFriendlyTxtExport(
  rows: Array<{ tab: TabRecord; analysis: PageAnalysis | null }>,
  exportedAtIso: string
): string {
  const doneRows = rows.filter((r) => r.tab.processingStatus === "done" && r.analysis);

  const lines: string[] = [];
  lines.push("I HAVE 2 MUCH TABS - KNOWLEDGE EXPORT");
  lines.push(`Exported at: ${exportedAtIso}`);
  lines.push(`Schema: tab_knowledge.v2-txt`);
  lines.push(`Total records: ${rows.length}`);
  lines.push(`Analyzed records: ${doneRows.length}`);
  lines.push("");
  lines.push("This file is designed to be easy to read by both humans and LLMs.");
  lines.push("Each item contains the tab URL, metadata, summaries, topics, tags, and extracted links.");
  lines.push("");
  lines.push("BEGIN RECORDS");
  lines.push("");

  for (const [index, row] of doneRows.entries()) {
    const analysis = row.analysis!;
    lines.push(`## Record ${index + 1}`);
    lines.push(`URL: ${row.tab.url}`);
    lines.push(`Tab Title: ${row.tab.tabTitle}`);
    lines.push(`Source Window: ${row.tab.sourceWindowLabel}`);
    lines.push(`Status: ${row.tab.processingStatus}`);
    lines.push(`Captured At (epoch ms): ${row.tab.capturedAt}`);
    lines.push(`Analyzed At: ${new Date(analysis.createdAt).toISOString()}`);
    lines.push(`HTTP Status: ${analysis.httpStatus ?? "unknown"}`);
    lines.push(`Fetch Status: ${analysis.fetchStatus}`);
    lines.push(`Model (chat): ${analysis.modelChat}`);
    lines.push(`Model (embedding): ${analysis.modelEmbedding}`);
    lines.push(`Prompt Version: ${analysis.promptVersion}`);
    lines.push(`Token Usage In: ${analysis.tokenUsageIn ?? "unknown"}`);
    lines.push(`Token Usage Out: ${analysis.tokenUsageOut ?? "unknown"}`);
    lines.push("");
    lines.push("Short Summary (EN):");
    lines.push(analysis.summaryShortEn || "(empty)");
    lines.push("");
    lines.push("Detailed Summary (EN):");
    lines.push(analysis.summaryDetailedEn || analysis.summaryShortEn || "(empty)");
    lines.push("");
    lines.push("Why Relevant (EN):");
    lines.push(analysis.whyRelevantEn || "(empty)");
    lines.push("");
    lines.push("Topics:");
    lines.push(safeList(analysis.topics, 50));
    lines.push("");
    lines.push("Tags:");
    lines.push(safeList(analysis.tags, 100));
    lines.push("");
    lines.push("Technologies:");
    lines.push(safeList(analysis.technologies ?? [], 100));
    lines.push("");
    lines.push("Extracted Links (first 50):");
    lines.push(safeList(analysis.extractedLinks ?? [], 50));
    lines.push("");
    lines.push("-----");
    lines.push("");
  }

  lines.push("END RECORDS");
  return lines.join("\n");
}
