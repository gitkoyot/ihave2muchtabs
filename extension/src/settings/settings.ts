import type { LlmSettings } from "../types/models";

const SETTINGS_KEY = "llm_settings";
const LEGACY_KEY = "azure_openai_settings";

export const DEFAULT_SETTINGS: LlmSettings = {
  provider: "azure_openai",
  embeddingProvider: "azure_openai",
  azure: {
    endpoint: "",
    apiKey: "",
    chatDeployment: "",
    embeddingDeployment: "",
    apiVersion: "2024-10-21"
  },
  anthropic: {
    apiKey: "",
    model: "claude-sonnet-4-20250514"
  },
  copilot: {
    endpoint: "",
    apiKey: "",
    chatModel: "",
    embeddingModel: ""
  },
  maxCharsPerPage: 12000,
  maxConcurrency: 2
};

interface LegacyAzureSettings {
  endpoint: string;
  apiKey: string;
  chatDeployment: string;
  embeddingDeployment: string;
  apiVersion: string;
  maxCharsPerPage: number;
  maxConcurrency: number;
}

function migrateLegacy(legacy: LegacyAzureSettings): LlmSettings {
  return {
    ...DEFAULT_SETTINGS,
    provider: "azure_openai",
    embeddingProvider: "azure_openai",
    azure: {
      endpoint: legacy.endpoint,
      apiKey: legacy.apiKey,
      chatDeployment: legacy.chatDeployment,
      embeddingDeployment: legacy.embeddingDeployment,
      apiVersion: legacy.apiVersion
    },
    maxCharsPerPage: legacy.maxCharsPerPage,
    maxConcurrency: legacy.maxConcurrency
  };
}

export async function loadSettings(): Promise<LlmSettings | null> {
  const data = await chrome.storage.local.get([SETTINGS_KEY, LEGACY_KEY]);

  if (data[SETTINGS_KEY]) {
    return data[SETTINGS_KEY] as LlmSettings;
  }

  if (data[LEGACY_KEY]) {
    const migrated = migrateLegacy(data[LEGACY_KEY] as LegacyAzureSettings);
    await chrome.storage.local.set({ [SETTINGS_KEY]: migrated });
    await chrome.storage.local.remove(LEGACY_KEY);
    return migrated;
  }

  return null;
}

export async function saveSettings(settings: LlmSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
