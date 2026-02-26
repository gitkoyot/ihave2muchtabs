import type { AzureOpenAISettings } from "../types/models";

const SETTINGS_KEY = "azure_openai_settings";

export const DEFAULT_SETTINGS: AzureOpenAISettings = {
  endpoint: "",
  apiKey: "",
  chatDeployment: "",
  embeddingDeployment: "",
  apiVersion: "2024-10-21",
  maxCharsPerPage: 12000,
  maxConcurrency: 2
};

export async function loadSettings(): Promise<AzureOpenAISettings | null> {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return (data[SETTINGS_KEY] as AzureOpenAISettings | undefined) ?? null;
}

export async function saveSettings(settings: AzureOpenAISettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

