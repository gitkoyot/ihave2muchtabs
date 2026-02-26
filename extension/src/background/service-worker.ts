import { scanBookmarks } from "../bookmarks/bookmarkScanner";
import { toExportRow, toJsonl } from "../export/jsonl";
import { loadSettings, saveSettings } from "../settings/settings";
import { listKnowledgeRows, saveBookmarkRecords } from "../storage/repository";
import type { RuntimeRequest, RuntimeResponse } from "../types/messages";
import { makeId } from "../utils/id";

let runtimeStatus = "idle";

chrome.runtime.onInstalled.addListener(() => {
  runtimeStatus = "ready";
});

chrome.runtime.onMessage.addListener((message: RuntimeRequest, _sender, sendResponse) => {
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
});

async function handleMessage(message: RuntimeRequest): Promise<RuntimeResponse> {
  switch (message.type) {
    case "GET_STATUS":
      return { ok: true, type: "STATUS", payload: { status: runtimeStatus } };

    case "GET_STATS": {
      const rows = await listKnowledgeRows();
      const stats = {
        total: rows.length,
        done: rows.filter((r) => r.bookmark.processingStatus === "done").length,
        failed: rows.filter((r) => r.bookmark.processingStatus === "failed").length,
        restricted: rows.filter((r) => r.bookmark.processingStatus === "restricted").length
      };
      return { ok: true, type: "STATS", payload: stats };
    }

    case "START_SCAN": {
      runtimeStatus = "scanning";
      const scanned = await scanBookmarks(message.payload?.folderIds);
      await saveBookmarkRecords(scanned);
      runtimeStatus = "scan_complete_pending_analysis";
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
      return {
        ok: false,
        error: "ASK_QUERY not implemented",
        details: "Add retrieval + Azure OpenAI answer pipeline in Sprint 4."
      };

    case "EXPORT_JSONL": {
      const rows = await listKnowledgeRows();
      const exportedAt = new Date().toISOString();
      const exportRows = rows
        .filter((row) => row.analysis && row.bookmark.processingStatus === "done")
        .map((row) => toExportRow(row.bookmark, row.analysis!, exportedAt));
      const jsonl = toJsonl(exportRows);
      const blob = new Blob([jsonl], { type: "application/x-ndjson" });
      const objectUrl = URL.createObjectURL(blob);
      const filename = `bookmark-knowledge-export-${new Date().toISOString().replace(/[:.]/g, "-")}.jsonl`;

      await chrome.downloads.download({ url: objectUrl, filename, saveAs: true });
      return { ok: true, type: "EXPORT_DONE", payload: { filename } };
    }
  }
}

