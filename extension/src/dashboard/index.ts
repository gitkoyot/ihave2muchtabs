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
  statsLine.textContent = `Total records: ${rows.length}`;

  for (const row of rows.slice(0, 100)) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(row.bookmark.processingStatus)}</td>
      <td>
        <div><strong>${escapeHtml(row.bookmark.bookmarkTitle)}</strong></div>
        <div class="muted">${escapeHtml(row.bookmark.url)}</div>
      </td>
      <td>${escapeHtml(row.analysis?.summaryShortEn ?? "")}</td>
      <td><button data-url="${encodeURIComponent(row.bookmark.url)}">Open</button></td>
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

window.addEventListener("DOMContentLoaded", () => {
  byId<HTMLButtonElement>("refreshBtn").addEventListener("click", () => void renderRows());
  byId<HTMLButtonElement>("exportBtn").addEventListener("click", async () => {
    const statsLine = byId<HTMLParagraphElement>("statsLine");
    const response = await sendRuntimeMessage({ type: "EXPORT_JSONL" });
    statsLine.textContent = response.ok ? `Exported: ${response.payload.filename}` : `Export failed: ${response.error}`;
  });
  void renderRows();
});

