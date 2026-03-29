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
    copilot: {
      endpoint: byId<HTMLInputElement>("copilotEndpoint").value.trim(),
      apiKey: byId<HTMLInputElement>("copilotApiKey").value.trim(),
      chatModel: byId<HTMLInputElement>("copilotChatModel").value.trim(),
      embeddingModel: byId<HTMLInputElement>("copilotEmbeddingModel").value.trim()
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

  byId<HTMLInputElement>("copilotEndpoint").value = settings.copilot.endpoint;
  byId<HTMLInputElement>("copilotApiKey").value = settings.copilot.apiKey;
  byId<HTMLInputElement>("copilotChatModel").value = settings.copilot.chatModel;
  byId<HTMLInputElement>("copilotEmbeddingModel").value = settings.copilot.embeddingModel;

  byId<HTMLInputElement>("maxCharsPerPage").value = String(settings.maxCharsPerPage);
  byId<HTMLInputElement>("maxConcurrency").value = String(settings.maxConcurrency);
}

function setupTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>(".tab-bar button"));
  const sections: Record<string, HTMLElement> = {
    azure: byId("sectionAzure"),
    anthropic: byId("sectionAnthropic"),
    copilot: byId("sectionCopilot")
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
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
  const result = byId<HTMLSpanElement>("result");
  const response = await sendRuntimeMessage({ type: "GET_SETTINGS" });
  if (!response.ok) {
    result.textContent = `Load failed: ${response.error}`;
    return;
  }
  if (response.type !== "SETTINGS") {
    result.textContent = `Unexpected response: ${response.type}`;
    return;
  }
  writeForm(response.payload ?? DEFAULT_SETTINGS);
}

async function savePage(): Promise<void> {
  const result = byId<HTMLSpanElement>("result");
  result.textContent = "Saving...";
  const response = await sendRuntimeMessage({ type: "SAVE_SETTINGS", payload: readForm() });
  if (!response.ok) {
    result.textContent = `Save failed: ${response.error}`;
    return;
  }
  result.textContent = response.type === "SETTINGS_SAVED" ? "Saved." : `Unexpected response: ${response.type}`;
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  byId<HTMLButtonElement>("saveBtn").addEventListener("click", () => void savePage());
  void loadPage();
});
