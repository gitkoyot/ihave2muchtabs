import { scanOpenTabs } from "../tabs/tabScanner";
import { clearDebugLogs, getDebugLogs, logDebug, logError, logInfo, logWarn } from "../debug/logger";
import { extractMainTextFromHtml } from "../extractor/contentExtractor";
import { toExportRow, toJsonl } from "../export/jsonl";
import { buildLlmFriendlyTxtExport } from "../export/txt";
import { fetchPage } from "../fetcher/pageFetcher";
import { answerQuery, generateEmbedding, generateSummary } from "../llm/azureOpenAIClient";
import { PROMPT_VERSIONS } from "../llm/prompts";
import { rankAnalysesBySimilarity } from "../search/retrieval";
import { loadSettings, saveSettings } from "../settings/settings";
import {
  clearKnowledgeBase,
  listKnowledgeRows,
  listPageAnalyses,
  listTabRecords,
  saveTabRecord,
  saveTabRecords,
  savePageAnalysis
} from "../storage/repository";
import type { PageAnalysis, TabRecord } from "../types/models";
import type { RuntimeRequest, RuntimeResponse } from "../types/messages";
import { sha256Hex } from "../utils/hash";
import { makeId } from "../utils/id";

let runtimeStatus = "idle";
let activeAnalysisPromise: Promise<void> | null = null;

chrome.runtime.onInstalled.addListener(() => {
  runtimeStatus = "ready";
  void logInfo("sw", "Extension installed, service worker ready");
});

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: RuntimeResponse) => void
  ) => {
  void handleMessage(message)
    .then((res) => sendResponse(res))
    .catch((error: unknown) =>
      sendResponse({
        ok: false,
        error: "Unhandled background error",
        details: error instanceof Error ? error.message : String(error)
      } satisfies RuntimeResponse)
    );
  return true;
  }
);

async function handleMessage(message: RuntimeRequest): Promise<RuntimeResponse> {
  await logDebug("sw.message", "Received message", { type: message.type });
  switch (message.type) {
    case "GET_STATUS":
      return { ok: true, type: "STATUS", payload: { status: runtimeStatus } };

    case "GET_STATS": {
      const rows = await listKnowledgeRows();
      const stats = {
        total: rows.length,
        pending: rows.filter((r) => r.tab.processingStatus === "pending").length,
        processing: rows.filter((r) => r.tab.processingStatus === "processing").length,
        done: rows.filter((r) => r.tab.processingStatus === "done").length,
        failed: rows.filter((r) => r.tab.processingStatus === "failed").length,
        restricted: rows.filter((r) => r.tab.processingStatus === "restricted").length
      };
      return { ok: true, type: "STATS", payload: stats };
    }

    case "START_SCAN": {
      runtimeStatus = "scanning";
      const scope = message.payload?.scope ?? "all_tabs";
      await logInfo("scan", "Starting open tabs scan", { scope, windowId: message.payload?.windowId ?? null });
      const scanOptions =
        typeof message.payload?.windowId === "number"
          ? { scope, windowId: message.payload.windowId }
          : { scope };
      const scanned = await scanOpenTabs(scanOptions);
      await logInfo("scan", "Open tabs scan completed", { scannedCount: scanned.length });
      await saveTabRecords(scanned);
      await logInfo("scan", "Tab records persisted", { persistedCount: scanned.length });
      void ensureAnalysisLoop();
      return { ok: true, type: "SCAN_STARTED", payload: { jobId: makeId("job") } };
    }

    case "GET_SETTINGS": {
      const settings = await loadSettings();
      return { ok: true, type: "SETTINGS", payload: settings };
    }

    case "SAVE_SETTINGS":
      await saveSettings(message.payload);
      return { ok: true, type: "SETTINGS_SAVED" };

    case "ASK_QUERY":
      await logInfo("ask", "ASK_QUERY requested", { chars: message.payload.question.length });
      return await handleAskQuery(message.payload.question);

    case "EXPORT_JSONL": {
      const rows = await listKnowledgeRows();
      const exportedAt = new Date().toISOString();
      const exportRows = rows
        .filter((row) => row.analysis && row.tab.processingStatus === "done")
        .map((row) => toExportRow(row.tab, row.analysis!, exportedAt));
      const jsonl = toJsonl(exportRows);
      const blob = new Blob([jsonl], { type: "application/x-ndjson" });
      const objectUrl = URL.createObjectURL(blob);
      const filename = `bookmark-knowledge-export-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;

      await chrome.downloads.download({ url: objectUrl, filename, saveAs: true });
      await logInfo("export", "JSONL export completed", { filename, rows: exportRows.length });
      return { ok: true, type: "EXPORT_DONE", payload: { filename } };
    }

    case "EXPORT_TXT": {
      const rows = await listKnowledgeRows();
      const exportedAt = new Date().toISOString();
      const text = buildLlmFriendlyTxtExport(rows, exportedAt);
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const objectUrl = URL.createObjectURL(blob);
      const filename = `tab-knowledge-export-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      await chrome.downloads.download({ url: objectUrl, filename, saveAs: true });
      await logInfo("export", "TXT export completed", { filename });
      return { ok: true, type: "EXPORT_TXT_DONE", payload: { filename } };
    }

    case "GET_DEBUG_LOGS":
      return { ok: true, type: "DEBUG_LOGS", payload: { logs: await getDebugLogs() } };

    case "CLEAR_DEBUG_LOGS":
      await clearDebugLogs();
      return { ok: true, type: "DEBUG_LOGS_CLEARED" };

    case "CLEAR_DATABASE":
      await clearKnowledgeBase();
      runtimeStatus = "idle";
      await logWarn("db", "Knowledge base cleared by user");
      return { ok: true, type: "DATABASE_CLEARED" };

    case "CLOSE_ANALYZED_TABS":
      return await handleCloseAnalyzedTabs(message.payload?.scope ?? "all_tabs", message.payload?.windowId);
  }
}

function hasUsableAzureSettings(
  settings: Awaited<ReturnType<typeof loadSettings>>
): settings is NonNullable<Awaited<ReturnType<typeof loadSettings>>> {
  return Boolean(
    settings &&
      settings.endpoint &&
      settings.apiKey &&
      settings.chatDeployment &&
      settings.embeddingDeployment &&
      settings.apiVersion
  );
}

async function ensureAnalysisLoop(): Promise<void> {
  if (activeAnalysisPromise) {
    return;
  }
  activeAnalysisPromise = runPendingAnalysisLoop().finally(() => {
    activeAnalysisPromise = null;
  });
  await activeAnalysisPromise;
}

async function runPendingAnalysisLoop(): Promise<void> {
  const settings = await loadSettings();
  if (!hasUsableAzureSettings(settings)) {
    runtimeStatus = "waiting_for_settings";
    await logWarn("analysis", "Analysis loop blocked: Azure settings missing or incomplete");
    return;
  }

  const records = await listTabRecords();
  const pending = records.filter((r) => r.processingStatus === "pending");
  if (pending.length === 0) {
    runtimeStatus = "idle";
    await logDebug("analysis", "No pending tabs to analyze");
    return;
  }

  runtimeStatus = `analyzing_${pending.length}_tabs`;
  const concurrency = Math.max(1, Math.min(10, settings.maxConcurrency || 2));
  await logInfo("analysis", "Starting pending tab analysis loop", {
    pendingCount: pending.length,
    concurrency
  });
  let cursor = 0;

  const workers = Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
    while (cursor < pending.length) {
      const index = cursor;
      cursor += 1;
      const record = pending[index];
      if (!record) {
        return;
      }
      await logDebug("analysis.worker", "Processing bookmark", {
        recordId: record.id,
        url: record.url
      });
      await processBookmarkRecord(record, settings);
    }
  });

  await Promise.all(workers);
  runtimeStatus = "idle";
  await logInfo("analysis", "Pending tab analysis loop finished");
}

async function processBookmarkRecord(
  record: TabRecord,
  settings: NonNullable<Awaited<ReturnType<typeof loadSettings>>>
): Promise<void> {
  const processingRecord: TabRecord = {
    ...record,
    processingStatus: "processing",
    lastErrorMessage: null,
    updatedAt: Date.now()
  };
  await saveTabRecord(processingRecord);
  await logDebug("analysis.item", "Record marked processing", { recordId: record.id, url: record.url });

  try {
    const fetchResult = await fetchPage(record.url, 15000);
    await logDebug("analysis.item", "Fetch completed", {
      recordId: record.id,
      status: fetchResult.httpStatus,
      ok: fetchResult.ok,
      finalUrl: fetchResult.finalUrl
    });
    if (!fetchResult.ok) {
      const restricted = fetchResult.httpStatus === 401 || fetchResult.httpStatus === 403;
      await saveTabRecord({
        ...processingRecord,
        processingStatus: restricted ? "restricted" : "failed",
        lastProcessedAt: Date.now(),
        lastErrorMessage: `Fetch failed with HTTP ${fetchResult.httpStatus ?? "unknown"}`,
        updatedAt: Date.now()
      });
      await logWarn("analysis.item", "Fetch not OK, tab record marked", {
        recordId: record.id,
        status: fetchResult.httpStatus,
        markedAs: restricted ? "restricted" : "failed"
      });
      return;
    }

    const extracted = extractMainTextFromHtml(fetchResult.html, fetchResult.finalUrl);
    const maxChars = Math.max(1000, settings.maxCharsPerPage || 12000);
    const truncatedText = extracted.text.slice(0, maxChars);
    if (!truncatedText.trim()) {
      await saveTabRecord({
        ...processingRecord,
        processingStatus: "failed",
        lastProcessedAt: Date.now(),
        lastErrorMessage: "Extracted text is empty",
        updatedAt: Date.now()
      });
      await logWarn("analysis.item", "Extracted text is empty", { recordId: record.id });
      return;
    }
    await logDebug("analysis.item", "Content extracted", {
      recordId: record.id,
      pageTitle: extracted.pageTitle,
      chars: truncatedText.length
    });

    const summary = await generateSummary(settings, {
      bookmarkTitle: record.tabTitle,
      url: record.url,
      pageTitle: extracted.pageTitle,
      contentText: truncatedText
    });
    await logDebug("analysis.item", "Summary generated", {
      recordId: record.id,
      tags: summary.result.tags,
      topics: summary.result.topics,
      tokenUsageIn: summary.tokenUsageIn,
      tokenUsageOut: summary.tokenUsageOut
    });

    const embeddingInput = [
      record.tabTitle,
      extracted.pageTitle,
      summary.result.summary_short,
      summary.result.why_relevant,
      ...summary.result.tags,
      ...summary.result.topics
    ].join("\n");
    const embedding = await generateEmbedding(settings, embeddingInput);
    const contentHash = await sha256Hex(truncatedText);
    await logDebug("analysis.item", "Embedding generated", {
      recordId: record.id,
      dimensions: embedding.length
    });

    const analysis: PageAnalysis = {
      id: makeId("analysis"),
      recordId: record.id,
      pageTitle: extracted.pageTitle,
      finalUrl: fetchResult.finalUrl,
      httpStatus: fetchResult.httpStatus,
      fetchStatus: "ok",
      contentHash,
      summaryShortEn: summary.result.summary_short,
      summaryDetailedEn: summary.result.summary_detailed,
      whyRelevantEn: summary.result.why_relevant,
      tags: summary.result.tags,
      topics: summary.result.topics,
      extractedLinks: extracted.links,
      embedding,
      modelChat: settings.chatDeployment,
      modelEmbedding: settings.embeddingDeployment,
      promptVersion: PROMPT_VERSIONS.summary,
      tokenUsageIn: summary.tokenUsageIn,
      tokenUsageOut: summary.tokenUsageOut,
      analysisVersion: 1,
      createdAt: Date.now()
    };

    await savePageAnalysis(analysis);
    await logDebug("analysis.item", "Analysis persisted", { recordId: record.id, analysisId: analysis.id });
    await saveTabRecord({
      ...processingRecord,
      processingStatus: "done",
      lastProcessedAt: Date.now(),
      lastErrorMessage: null,
      updatedAt: Date.now()
    });
    await logInfo("analysis.item", "Tab analysis completed", { recordId: record.id, url: record.url });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    const looksRestricted =
      details.includes("401") || details.includes("403") || details.toLowerCase().includes("forbidden");
    await saveTabRecord({
      ...processingRecord,
      processingStatus: looksRestricted ? "restricted" : "failed",
      lastProcessedAt: Date.now(),
      lastErrorMessage: details.slice(0, 500),
      updatedAt: Date.now()
    });
    await logError("analysis.item", "Tab analysis failed", {
      recordId: record.id,
      url: record.url,
      error: details
    });
  }
}

async function handleAskQuery(question: string): Promise<RuntimeResponse> {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) {
    await logWarn("ask", "Rejected empty query");
    return { ok: false, error: "Question is empty" };
  }

  const settings = await loadSettings();
  if (!hasUsableAzureSettings(settings)) {
    await logWarn("ask", "ASK_QUERY blocked: Azure settings missing");
    return { ok: false, error: "Azure OpenAI settings are missing or incomplete" };
  }

  const [tabs, analyses] = await Promise.all([listTabRecords(), listPageAnalyses()]);
  const doneTabs = new Map(tabs.filter((b) => b.processingStatus === "done").map((b) => [b.id, b]));
  const usableAnalyses = analyses.filter((a) => doneTabs.has(a.recordId) && a.embedding.length > 0);

  if (usableAnalyses.length === 0) {
    await logWarn("ask", "ASK_QUERY blocked: no analyzed tabs");
    return { ok: false, error: "No analyzed tabs available yet" };
  }

  const queryEmbedding = await generateEmbedding(settings, cleanQuestion);
  await logDebug("ask", "Query embedding generated", { dimensions: queryEmbedding.length });
  const ranked = rankAnalysesBySimilarity(queryEmbedding, usableAnalyses, 8);
  if (ranked.length === 0) {
    await logWarn("ask", "No semantic matches found", { question: cleanQuestion });
    return { ok: false, error: "No semantic matches found" };
  }
  await logDebug("ask", "Semantic matches ranked", {
    topK: ranked.length,
    topScores: ranked.slice(0, 3).map((r) => r.score)
  });

  const retrievalRecords = ranked.map(({ analysis, score }) => {
    const tab = doneTabs.get(analysis.recordId)!;
    return {
      score,
      url: tab.url,
      tab_title: tab.tabTitle,
      source_window: tab.sourceWindowLabel,
      page_title: analysis.pageTitle,
      summary_short_en: analysis.summaryShortEn,
      summary_detailed_en: analysis.summaryDetailedEn,
      why_relevant_en: analysis.whyRelevantEn,
      tags: analysis.tags,
      topics: analysis.topics
    };
  });

  const answer = await answerQuery(settings, cleanQuestion, JSON.stringify(retrievalRecords, null, 2));
  await logInfo("ask", "ASK_QUERY answered", {
    matched: answer.matched_urls.length,
    related: answer.related_urls.length,
    confidence: answer.confidence
  });
  return { ok: true, type: "ASK_RESULT", payload: answer };
}

async function handleCloseAnalyzedTabs(
  scope: "all_tabs" | "current_window",
  windowId?: number
): Promise<RuntimeResponse> {
  const tabRecords = await listTabRecords();
  const analyzedUrls = new Set(tabRecords.filter((t) => t.processingStatus === "done").map((t) => t.url));
  if (analyzedUrls.size === 0) {
    await logWarn("close", "No analyzed tabs available to close");
    return { ok: true, type: "CLOSE_ANALYZED_TABS_DONE", payload: { closedCount: 0, candidateCount: 0 } };
  }

  const queryInfo: chrome.tabs.QueryInfo =
    scope === "current_window" && typeof windowId === "number" ? { windowId } : {};
  const openTabs = await chrome.tabs.query(queryInfo);
  const closableTabIds: number[] = [];

  for (const tab of openTabs) {
    if (typeof tab.id !== "number") continue;
    if (!tab.url?.startsWith("http://") && !tab.url?.startsWith("https://")) continue;
    if (!analyzedUrls.has(tab.url)) continue;
    if (tab.active && scope === "current_window") {
      // Avoid closing the active tab in current-window mode to reduce accidental context loss.
      continue;
    }
    closableTabIds.push(tab.id);
  }

  if (closableTabIds.length > 0) {
    await chrome.tabs.remove(closableTabIds);
  }
  await logInfo("close", "Closed analyzed tabs", {
    scope,
    windowId: windowId ?? null,
    closedCount: closableTabIds.length,
    candidateCount: analyzedUrls.size
  });
  return {
    ok: true,
    type: "CLOSE_ANALYZED_TABS_DONE",
    payload: { closedCount: closableTabIds.length, candidateCount: analyzedUrls.size }
  };
}
