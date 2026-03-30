import { DEFAULT_SETTINGS } from "../settings/settings";
import type { LlmSettings } from "../types/models";
import { sendRuntimeMessage } from "../utils/runtime";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element: ${id}`);
  }
  return el as T;
}

function setResult(text: string, state: "ok" | "error" | "partial" | "info"): void {
  const el = byId<HTMLDivElement>("result");
  el.textContent = text;
  el.className = state === "info" ? "visible" : `visible ${state}`;
}

function readForm(): LlmSettings {
  return {
    provider: byId<HTMLSelectElement>("provider").value as LlmSettings["provider"],
    embeddingProvider: byId<HTMLSelectElement>("embeddingProvider").value as LlmSettings["embeddingProvider"],
    azure: {
      endpoint: byId<HTMLInputElement>("azureEndpoint").value.trim(),
      apiKey: byId<HTMLInputElement>("azureApiKey").value.trim(),
      chatDeployment: byId<HTMLInputElement>("azureChatDeployment").value.trim(),
      embeddingDeployment: byId<HTMLInputElement>("azureEmbeddingDeployment").value.trim(),
      apiVersion: byId<HTMLInputElement>("azureApiVersion").value.trim() || DEFAULT_SETTINGS.azure.apiVersion
    },
    anthropic: {
      apiKey: byId<HTMLInputElement>("anthropicApiKey").value.trim(),
      model: byId<HTMLSelectElement>("anthropicModel").value
    },
    ollama: {
      endpoint: byId<HTMLInputElement>("ollamaEndpoint").value.trim() || DEFAULT_SETTINGS.ollama.endpoint,
      chatModel: byId<HTMLInputElement>("ollamaChatModel").value.trim(),
      embeddingModel: byId<HTMLInputElement>("ollamaEmbeddingModel").value.trim()
    },
    maxCharsPerPage: Number(byId<HTMLInputElement>("maxCharsPerPage").value || DEFAULT_SETTINGS.maxCharsPerPage),
    maxConcurrency: Number(byId<HTMLInputElement>("maxConcurrency").value || DEFAULT_SETTINGS.maxConcurrency)
  };
}

function writeForm(settings: LlmSettings): void {
  byId<HTMLSelectElement>("provider").value = settings.provider;
  byId<HTMLSelectElement>("embeddingProvider").value = settings.embeddingProvider;

  byId<HTMLInputElement>("azureEndpoint").value = settings.azure.endpoint;
  byId<HTMLInputElement>("azureApiKey").value = settings.azure.apiKey;
  byId<HTMLInputElement>("azureChatDeployment").value = settings.azure.chatDeployment;
  byId<HTMLInputElement>("azureEmbeddingDeployment").value = settings.azure.embeddingDeployment;
  byId<HTMLInputElement>("azureApiVersion").value = settings.azure.apiVersion;

  byId<HTMLInputElement>("anthropicApiKey").value = settings.anthropic.apiKey;
  byId<HTMLSelectElement>("anthropicModel").value = settings.anthropic.model;

  byId<HTMLInputElement>("ollamaEndpoint").value = settings.ollama.endpoint;
  byId<HTMLInputElement>("ollamaChatModel").value = settings.ollama.chatModel;
  byId<HTMLInputElement>("ollamaEmbeddingModel").value = settings.ollama.embeddingModel;

  byId<HTMLInputElement>("maxCharsPerPage").value = String(settings.maxCharsPerPage);
  byId<HTMLInputElement>("maxConcurrency").value = String(settings.maxConcurrency);
}

function setupTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab-bar button"));
  const sections: Record<string, HTMLElement> = {
    azure: byId("sectionAzure"),
    anthropic: byId("sectionAnthropic"),
    ollama: byId("sectionOllama")
  };

  for (const tab of tabs) {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const target = tab.dataset.tab;
      if (!target) return;

      for (const t of tabs) t.classList.remove("active");
      tab.classList.add("active");

      for (const key of Object.keys(sections)) {
        const section = sections[key];
        if (section) section.classList.toggle("active", key === target);
      }
    });
  }
}

async function loadPage(): Promise<void> {
  const response = await sendRuntimeMessage({ type: "GET_SETTINGS" });
  if (!response.ok) {
    setResult(`Load failed: ${response.error}`, "error");
    return;
  }
  if (response.type !== "SETTINGS") {
    setResult(`Unexpected response: ${response.type}`, "error");
    return;
  }
  writeForm(response.payload ?? DEFAULT_SETTINGS);
}

async function checkConnectionPage(): Promise<void> {
  setResult("Checking connection...", "info");
  const response = await sendRuntimeMessage({ type: "CHECK_CONNECTION", payload: readForm() });
  if (!response.ok) {
    setResult(`Check failed: ${response.error}`, "error");
    return;
  }
  if (response.type !== "CONNECTION_RESULT") return;
  const { chat, embedding } = response.payload;
  const chatOk = chat === "ok";
  const embOk = embedding === "ok";
  const chatLine = chatOk ? "✓ Chat: OK" : `✗ Chat: ${chat}`;
  const embLine = embOk ? "✓ Embedding: OK" : `✗ Embedding: ${embedding}`;
  const state = chatOk && embOk ? "ok" : chatOk || embOk ? "partial" : "error";
  setResult(`${chatLine}\n${embLine}`, state);
}

async function savePage(): Promise<void> {
  setResult("Saving...", "info");
  const response = await sendRuntimeMessage({ type: "SAVE_SETTINGS", payload: readForm() });
  if (!response.ok) {
    setResult(`Save failed: ${response.error}`, "error");
    return;
  }
  setResult(response.type === "SETTINGS_SAVED" ? "Settings saved." : `Unexpected response: ${response.type}`,
    response.type === "SETTINGS_SAVED" ? "ok" : "error");
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  byId<HTMLButtonElement>("saveBtn").addEventListener("click", () => void savePage());
  byId<HTMLButtonElement>("checkBtn").addEventListener("click", () => void checkConnectionPage());
  void loadPage();
});
