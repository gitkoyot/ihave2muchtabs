import type { LlmSettings } from "../types/models";
import { api } from "../utils/browser-api";

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
  local: {
    endpoint: "http://localhost:11434",
    chatModel: "llama3.1:latest",
    embeddingModel: "nomic-embed-text:latest"
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
  const data = await api.storage.local.get([SETTINGS_KEY, LEGACY_KEY]);

  if (data[SETTINGS_KEY]) {
    const saved = data[SETTINGS_KEY] as LlmSettings & { ollama?: LlmSettings["local"] };
    if ((saved.provider as string) === "copilot") {
      saved.provider = "azure_openai";
    }
    if ((saved.embeddingProvider as string) === "copilot") {
      saved.embeddingProvider = "azure_openai";
    }
    // Migrate the former "ollama" provider/field to the generic "local" model.
    if ((saved.provider as string) === "ollama") {
      saved.provider = "local";
    }
    if ((saved.embeddingProvider as string) === "ollama") {
      saved.embeddingProvider = "local";
    }
    if (!saved.local && saved.ollama) {
      saved.local = saved.ollama;
    }
    if (!saved.local) {
      saved.local = DEFAULT_SETTINGS.local;
    }
    delete saved.ollama;
    return saved;
  }

  if (data[LEGACY_KEY]) {
    const migrated = migrateLegacy(data[LEGACY_KEY] as LegacyAzureSettings);
    await api.storage.local.set({ [SETTINGS_KEY]: migrated });
    await api.storage.local.remove(LEGACY_KEY);
    return migrated;
  }

  return null;
}

export async function saveSettings(settings: LlmSettings): Promise<void> {
  await api.storage.local.set({ [SETTINGS_KEY]: settings });
}
