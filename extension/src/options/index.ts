import { DEFAULT_SETTINGS } from "../settings/settings";
import type { AzureOpenAISettings } from "../types/models";
import { sendRuntimeMessage } from "../utils/runtime";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: ${id}`);
  }
  return el as T;
}

function readForm(): AzureOpenAISettings {
  return {
    endpoint: byId<HTMLInputElement>("endpoint").value.trim(),
    apiKey: byId<HTMLInputElement>("apiKey").value.trim(),
    chatDeployment: byId<HTMLInputElement>("chatDeployment").value.trim(),
    embeddingDeployment: byId<HTMLInputElement>("embeddingDeployment").value.trim(),
    apiVersion: byId<HTMLInputElement>("apiVersion").value.trim() || DEFAULT_SETTINGS.apiVersion,
    maxCharsPerPage: Number(byId<HTMLInputElement>("maxCharsPerPage").value || DEFAULT_SETTINGS.maxCharsPerPage),
    maxConcurrency: Number(byId<HTMLInputElement>("maxConcurrency").value || DEFAULT_SETTINGS.maxConcurrency)
  };
}

function writeForm(settings: AzureOpenAISettings): void {
  byId<HTMLInputElement>("endpoint").value = settings.endpoint;
  byId<HTMLInputElement>("apiKey").value = settings.apiKey;
  byId<HTMLInputElement>("chatDeployment").value = settings.chatDeployment;
  byId<HTMLInputElement>("embeddingDeployment").value = settings.embeddingDeployment;
  byId<HTMLInputElement>("apiVersion").value = settings.apiVersion;
  byId<HTMLInputElement>("maxCharsPerPage").value = String(settings.maxCharsPerPage);
  byId<HTMLInputElement>("maxConcurrency").value = String(settings.maxConcurrency);
}

async function loadPage(): Promise<void> {
  const result = byId<HTMLSpanElement>("result");
  const response = await sendRuntimeMessage({ type: "GET_SETTINGS" });
  if (!response.ok) {
    result.textContent = `Load failed: ${response.error}`;
    return;
  }
  writeForm(response.payload ?? DEFAULT_SETTINGS);
}

async function savePage(): Promise<void> {
  const result = byId<HTMLSpanElement>("result");
  result.textContent = "Saving...";
  const response = await sendRuntimeMessage({ type: "SAVE_SETTINGS", payload: readForm() });
  result.textContent = response.ok ? "Saved." : `Save failed: ${response.error}`;
}

window.addEventListener("DOMContentLoaded", () => {
  byId<HTMLButtonElement>("saveBtn").addEventListener("click", () => void savePage());
  void loadPage();
});

