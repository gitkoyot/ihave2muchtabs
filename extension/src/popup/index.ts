import { sendRuntimeMessage } from "../utils/runtime";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: ${id}`);
  }
  return el as T;
}

async function refreshStatus(): Promise<void> {
  const box = byId<HTMLDivElement>("statusBox");
  const progressFill = byId<HTMLDivElement>("progressBarFill");
  const [status, stats] = await Promise.all([
    sendRuntimeMessage({ type: "GET_STATUS" }),
    sendRuntimeMessage({ type: "GET_STATS" })
  ]);

  if (!status.ok) {
    box.textContent = `Status error: ${status.error}`;
    return;
  }
  if (!stats.ok) {
    box.textContent = `Stats error: ${stats.error}`;
    return;
  }
  if (status.type !== "STATUS") {
    box.textContent = `Unexpected status response: ${status.type}`;
    return;
  }
  if (stats.type !== "STATS") {
    box.textContent = `Unexpected stats response: ${stats.type}`;
    return;
  }
  const total = asNumber(stats.payload.total);
  const pending = asNumber(stats.payload.pending);
  const processing = asNumber(stats.payload.processing);
  const done = asNumber(stats.payload.done);
  const failed = asNumber(stats.payload.failed);
  const restricted = asNumber(stats.payload.restricted);
  const remaining = pending + processing;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = `${Math.max(0, Math.min(100, progress))}%`;

  box.textContent = [
    `Engine: ${status.payload.status}`,
    `Progress: ${done}/${total} done (${progress}%)`,
    `Remaining: ${remaining} (pending ${pending}, processing ${processing})`,
    `Failed: ${failed} | Restricted: ${restricted}`
  ].join("\n");
}

async function startScan(): Promise<void> {
  const box = byId<HTMLDivElement>("statusBox");
  box.textContent = "Starting scan...";
  const scope = byId<HTMLSelectElement>("scanScope").value as "all_tabs" | "current_window";
  const currentWindow = await chrome.windows.getCurrent();
  const payload =
    typeof currentWindow.id === "number"
      ? ({ scope, windowId: currentWindow.id } as const)
      : ({ scope } as const);
  const res = await sendRuntimeMessage({
    type: "START_SCAN",
    payload
  });
  if (!res.ok) {
    box.textContent = `Error: ${res.error}`;
  } else if (res.type === "SCAN_STARTED") {
    box.textContent = `Started job: ${res.payload.jobId}`;
  } else {
    box.textContent = `Unexpected response: ${res.type}`;
  }
  await refreshStatus();
}

async function askQuestion(): Promise<void> {
  const input = byId<HTMLInputElement>("questionInput");
  const box = byId<HTMLDivElement>("statusBox");
  const question = input.value.trim();
  if (!question) {
    box.textContent = "Enter a question first.";
    return;
  }
  const res = await sendRuntimeMessage({ type: "ASK_QUERY", payload: { question } });
  if (!res.ok) {
    box.textContent = `Error: ${res.error}`;
    return;
  }
  if (res.type !== "ASK_RESULT") {
    box.textContent = `Unexpected response: ${res.type}`;
    return;
  }
  box.textContent = formatAskResult(res.payload);
}

async function closeAnalyzedTabs(): Promise<void> {
  const box = byId<HTMLDivElement>("statusBox");
  const scope = byId<HTMLSelectElement>("scanScope").value as "all_tabs" | "current_window";
  const confirmed = window.confirm(
    scope === "current_window"
      ? "Close analyzed tabs in the current window? (active tab will be skipped)"
      : "Close analyzed tabs across all windows?"
  );
  if (!confirmed) {
    return;
  }

  const currentWindow = await chrome.windows.getCurrent();
  const payload =
    typeof currentWindow.id === "number"
      ? ({ scope, windowId: currentWindow.id } as const)
      : ({ scope } as const);
  const res = await sendRuntimeMessage({
    type: "CLOSE_ANALYZED_TABS",
    payload
  });
  if (!res.ok) {
    box.textContent = `Error: ${res.error}`;
    return;
  }
  if (res.type !== "CLOSE_ANALYZED_TABS_DONE") {
    box.textContent = `Unexpected response: ${res.type}`;
    return;
  }
  box.textContent = `Closed ${res.payload.closedCount} tab(s). Analyzed URL candidates: ${res.payload.candidateCount}.`;
  await refreshStatus();
}

async function exportTxt(): Promise<void> {
  const box = byId<HTMLDivElement>("statusBox");
  box.textContent = "Preparing TXT export...";
  const res = await sendRuntimeMessage({ type: "EXPORT_TXT" });
  if (!res.ok) {
    box.textContent = `Error: ${res.error}`;
    return;
  }
  if (res.type !== "EXPORT_TXT_DONE") {
    box.textContent = `Unexpected response: ${res.type}`;
    return;
  }
  box.textContent = `TXT exported: ${res.payload.filename}`;
}

function formatAskResult(payload: {
  answer: string;
  matched_urls: Array<{ url: string; reason: string }>;
  related_urls: Array<{ url: string; reason: string }>;
  confidence: number;
}): string {
  const lines: string[] = [];
  lines.push(`Answer: ${payload.answer}`);
  lines.push(`Confidence: ${payload.confidence.toFixed(2)}`);
  lines.push("");
  lines.push("Matched URLs:");
  if (payload.matched_urls.length === 0) {
    lines.push("- none");
  } else {
    for (const item of payload.matched_urls) {
      lines.push(`- ${item.url}`);
      lines.push(`  ${item.reason}`);
    }
  }
  lines.push("");
  lines.push("Related URLs:");
  if (payload.related_urls.length === 0) {
    lines.push("- none");
  } else {
    for (const item of payload.related_urls) {
      lines.push(`- ${item.url}`);
      lines.push(`  ${item.reason}`);
    }
  }
  return lines.join("\n");
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

window.addEventListener("DOMContentLoaded", () => {
  byId<HTMLButtonElement>("scanBtn").addEventListener("click", () => void startScan());
  byId<HTMLButtonElement>("openDashboardBtn").addEventListener("click", () => {
    window.open(chrome.runtime.getURL("dashboard.html"), "_blank");
  });
  byId<HTMLButtonElement>("closeAnalyzedBtn").addEventListener("click", () => void closeAnalyzedTabs());
  byId<HTMLButtonElement>("statsBtn").addEventListener("click", () => void refreshStatus());
  byId<HTMLButtonElement>("exportTxtBtn").addEventListener("click", () => void exportTxt());
  byId<HTMLButtonElement>("askBtn").addEventListener("click", () => void askQuestion());
  void refreshStatus();
  window.setInterval(() => {
    void refreshStatus();
  }, 2000);
});
