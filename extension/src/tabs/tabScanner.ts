import type { TabRecord } from "../types/models";
import { makeId } from "../utils/id";
import { api } from "../utils/browser-api";

export function isSupportedUrl(url: unknown): boolean {
  if (typeof url !== "string" || url === "") {
    return false;
  }
  return url.startsWith("http://") || url.startsWith("https://");
}

export async function scanOpenTabs(options?: { scope?: "all_tabs" | "current_window"; windowId?: number }): Promise<TabRecord[]> {
  const queryInfo: chrome.tabs.QueryInfo =
    options?.scope === "current_window" && typeof options.windowId === "number"
      ? { windowId: options.windowId }
      : {};
  const tabs = await api.tabs.query(queryInfo);
  const seenUrls = new Set<string>();
  const now = Date.now();
  const records: TabRecord[] = [];

  for (const tab of tabs) {
    const url = tab.url?.trim();
    if (!url || !isSupportedUrl(url)) {
      continue;
    }
    if (seenUrls.has(url)) {
      continue;
    }
    seenUrls.add(url);

    records.push({
      id: makeId("rec"),
      tabId: String(tab.id ?? ""),
      url,
      tabTitle: tab.title?.trim() || url,
      sourceWindowId: typeof tab.windowId === "number" ? tab.windowId : null,
      sourceWindowLabel: `Window ${tab.windowId ?? "unknown"}`,
      capturedAt: now,
      processingStatus: "pending",
      lastProcessedAt: null,
      lastErrorMessage: null,
      createdAt: now,
      updatedAt: now
    });
  }

  return records;
}
