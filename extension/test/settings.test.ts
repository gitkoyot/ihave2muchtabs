import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const set = vi.fn();
const remove = vi.fn();

vi.mock("../src/utils/browser-api", () => ({
  api: {
    storage: {
      local: { get, set, remove }
    }
  }
}));

describe("settings", () => {
  beforeEach(() => {
    get.mockReset();
    set.mockReset();
    remove.mockReset();
    set.mockResolvedValue(undefined);
    remove.mockResolvedValue(undefined);
  });

  it("returns null when nothing is saved", async () => {
    get.mockResolvedValue({});
    const { loadSettings } = await import("../src/settings/settings");
    await expect(loadSettings()).resolves.toBeNull();
  });

  it("normalizes legacy copilot provider values and fills missing local settings", async () => {
    const { DEFAULT_SETTINGS, loadSettings } = await import("../src/settings/settings");
    get.mockResolvedValue({
      llm_settings: {
        ...DEFAULT_SETTINGS,
        provider: "copilot",
        embeddingProvider: "copilot",
        local: undefined
      }
    });

    const result = await loadSettings();

    expect(result?.provider).toBe("azure_openai");
    expect(result?.embeddingProvider).toBe("azure_openai");
    expect(result?.local).toEqual(DEFAULT_SETTINGS.local);
  });

  it("migrates the former ollama provider and field to local", async () => {
    const { loadSettings } = await import("../src/settings/settings");
    const localCfg = { endpoint: "http://localhost:1234", chatModel: "qwen", embeddingModel: "nomic" };
    get.mockResolvedValue({
      llm_settings: {
        provider: "ollama",
        embeddingProvider: "ollama",
        azure: { endpoint: "", apiKey: "", chatDeployment: "", embeddingDeployment: "", apiVersion: "2024-10-21" },
        anthropic: { apiKey: "", model: "claude-sonnet-4-20250514" },
        ollama: localCfg,
        maxCharsPerPage: 12000,
        maxConcurrency: 2
      }
    });

    const result = await loadSettings();

    expect(result?.provider).toBe("local");
    expect(result?.embeddingProvider).toBe("local");
    expect(result?.local).toEqual(localCfg);
    expect((result as Record<string, unknown>).ollama).toBeUndefined();
  });

  it("migrates legacy Azure settings into the current shape", async () => {
    const { loadSettings } = await import("../src/settings/settings");
    get.mockResolvedValue({
      azure_openai_settings: {
        endpoint: "https://azure.test",
        apiKey: "key",
        chatDeployment: "chat",
        embeddingDeployment: "embed",
        apiVersion: "2024-10-21",
        maxCharsPerPage: 5000,
        maxConcurrency: 4
      }
    });

    const result = await loadSettings();

    expect(result).toMatchObject({
      provider: "azure_openai",
      embeddingProvider: "azure_openai",
      azure: {
        endpoint: "https://azure.test",
        apiKey: "key",
        chatDeployment: "chat",
        embeddingDeployment: "embed",
        apiVersion: "2024-10-21"
      },
      maxCharsPerPage: 5000,
      maxConcurrency: 4
    });
    expect(set).toHaveBeenCalledWith({ llm_settings: result });
    expect(remove).toHaveBeenCalledWith("azure_openai_settings");
  });

  it("persists settings under the current storage key", async () => {
    const { DEFAULT_SETTINGS, saveSettings } = await import("../src/settings/settings");
    await saveSettings(DEFAULT_SETTINGS);
    expect(set).toHaveBeenCalledWith({ llm_settings: DEFAULT_SETTINGS });
  });
});
