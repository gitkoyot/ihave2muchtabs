import { listKnowledgeRows } from "../storage/repository";
import { sendRuntimeMessage } from "../utils/runtime";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: ${id}`);
  }
  return el as T;
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function renderRows(): Promise<void> {
  const rowsEl = byId<HTMLTableSectionElement>("rows");
  const statsLine = byId<HTMLParagraphElement>("statsLine");
  rowsEl.innerHTML = "";

  const rows = await listKnowledgeRows();
  const done = rows.filter((r) => r.tab.processingStatus === "done").length;
  const failed = rows.filter((r) => r.tab.processingStatus === "failed").length;
  const processing = rows.filter((r) => r.tab.processingStatus === "processing").length;
  const pending = rows.filter((r) => r.tab.processingStatus === "pending").length;
  statsLine.textContent = `Total: ${rows.length} | Done: ${done} | Processing: ${processing} | Pending: ${pending} | Failed: ${failed}`;

  for (const row of rows.slice(0, 100)) {
    const tr = document.createElement("tr");
    const diagnostics = [
      `HTTP: ${row.analysis?.httpStatus ?? "-"}`,
      `Fetch: ${row.analysis?.fetchStatus ?? "-"}`,
      `Processed: ${row.tab.lastProcessedAt ? new Date(row.tab.lastProcessedAt).toLocaleString() : "-"}`,
      `Tokens in/out: ${row.analysis ? `${row.analysis.tokenUsageIn ?? "-"} / ${row.analysis.tokenUsageOut ?? "-"}` : "-"}`,
      `Links found: ${row.analysis?.extractedLinks?.length ?? 0}`,
      `Last error: ${row.tab.lastErrorMessage ?? "-"}`
    ].join("\n");
    const detailedSummary = row.analysis?.summaryDetailedEn ?? row.analysis?.summaryShortEn ?? "";
    const linksPreview = (row.analysis?.extractedLinks ?? []).slice(0, 5);
    const technologiesPreview = (row.analysis?.technologies ?? []).slice(0, 15);
    tr.innerHTML = `
      <td><span class="badge status-${escapeHtml(row.tab.processingStatus)}">${escapeHtml(row.tab.processingStatus)}</span></td>
      <td>
        <div><strong>${escapeHtml(row.tab.tabTitle)}</strong></div>
        <div class="muted">${escapeHtml(row.tab.url)}</div>
        <div class="muted">${escapeHtml(row.tab.sourceWindowLabel)}</div>
      </td>
      <td>
        <div>${escapeHtml(detailedSummary)}</div>
        <div class="muted" style="margin-top:6px;"><strong>Technologies:</strong> ${escapeHtml(technologiesPreview.join(", ") || "none")}</div>
        <div class="muted" style="margin-top:6px;">${escapeHtml(linksPreview.join("\n"))}</div>
      </td>
      <td><pre style="margin:0; white-space:pre-wrap;">${escapeHtml(diagnostics)}</pre></td>
      <td><button data-url="${encodeURIComponent(row.tab.url)}">Open</button></td>
    `;
    rowsEl.appendChild(tr);
  }

  rowsEl.querySelectorAll<HTMLButtonElement>("button[data-url]").forEach((button) => {
    button.addEventListener("click", () => {
      const encoded = button.getAttribute("data-url");
      if (!encoded) return;
      window.open(decodeURIComponent(encoded), "_blank");
    });
  });
}

async function renderLogs(): Promise<void> {
  const logsPanel = byId<HTMLPreElement>("logsPanel");
  const response = await sendRuntimeMessage({ type: "GET_DEBUG_LOGS" });
  if (!response.ok) {
    logsPanel.textContent = `Failed to load logs: ${response.error}`;
    return;
  }
  if (response.type !== "DEBUG_LOGS") {
    logsPanel.textContent = `Unexpected response: ${response.type}`;
    return;
  }
  logsPanel.textContent = response.payload.logs
    .slice(-80)
    .map((l) => `${l.ts} [${l.level}] [${l.scope}] ${l.message}${l.data ? ` | ${l.data}` : ""}`)
    .join("\n");
}

window.addEventListener("DOMContentLoaded", () => {
  byId<HTMLButtonElement>("refreshBtn").addEventListener("click", () => void renderRows());
  byId<HTMLButtonElement>("exportBtn").addEventListener("click", async () => {
    const statsLine = byId<HTMLParagraphElement>("statsLine");
    const response = await sendRuntimeMessage({ type: "EXPORT_JSONL" });
    if (!response.ok) {
      statsLine.textContent = `Export failed: ${response.error}`;
      return;
    }
    statsLine.textContent =
      response.type === "EXPORT_DONE" ? `Exported: ${response.payload.filename}` : `Unexpected response: ${response.type}`;
  });
  byId<HTMLButtonElement>("exportTxtBtn").addEventListener("click", async () => {
    const statsLine = byId<HTMLParagraphElement>("statsLine");
    const response = await sendRuntimeMessage({ type: "EXPORT_TXT" });
    if (!response.ok) {
      statsLine.textContent = `TXT export failed: ${response.error}`;
      return;
    }
    statsLine.textContent =
      response.type === "EXPORT_TXT_DONE" ? `TXT exported: ${response.payload.filename}` : `Unexpected response: ${response.type}`;
  });
  byId<HTMLButtonElement>("clearDbBtn").addEventListener("click", async () => {
    const statsLine = byId<HTMLParagraphElement>("statsLine");
    const confirmed = window.confirm("Clear all stored tab records, analyses, jobs, and query history?");
    if (!confirmed) return;
    const response = await sendRuntimeMessage({ type: "CLEAR_DATABASE" });
    if (!response.ok) {
      statsLine.textContent = `Clear DB failed: ${response.error}`;
      return;
    }
    statsLine.textContent = response.type === "DATABASE_CLEARED" ? "Database cleared." : `Unexpected response: ${response.type}`;
    await renderRows();
  });
  byId<HTMLButtonElement>("logsBtn").addEventListener("click", () => void renderLogs());
  byId<HTMLButtonElement>("clearLogsBtn").addEventListener("click", async () => {
    const logsPanel = byId<HTMLPreElement>("logsPanel");
    const response = await sendRuntimeMessage({ type: "CLEAR_DEBUG_LOGS" });
    logsPanel.textContent = response.ok ? "" : `Clear failed: ${response.error}`;
  });
  void renderRows();
  void renderLogs();
  window.setInterval(() => {
    void renderRows();
  }, 2500);
});
