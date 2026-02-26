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

  box.textContent = `Status: ${status.payload.status}\nStats: ${JSON.stringify(stats.payload)}`;
}

async function startScan(): Promise<void> {
  const box = byId<HTMLDivElement>("statusBox");
  box.textContent = "Scanning bookmarks...";
  const res = await sendRuntimeMessage({ type: "START_SCAN" });
  box.textContent = res.ok ? `Started job: ${res.payload.jobId}` : `Error: ${res.error}`;
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
  box.textContent = res.ok ? JSON.stringify(res.payload, null, 2) : `Error: ${res.error}`;
}

window.addEventListener("DOMContentLoaded", () => {
  byId<HTMLButtonElement>("scanBtn").addEventListener("click", () => void startScan());
  byId<HTMLButtonElement>("statsBtn").addEventListener("click", () => void refreshStatus());
  byId<HTMLButtonElement>("askBtn").addEventListener("click", () => void askQuestion());
  void refreshStatus();
});

