import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSupportedUrl, scanOpenTabs } from "../src/tabs/tabScanner";

describe("isSupportedUrl", () => {
  it("accepts only http and https URLs", () => {
    expect(isSupportedUrl("http://example.com")).toBe(true);
    expect(isSupportedUrl("https://example.com")).toBe(true);
    expect(isSupportedUrl("file:///test")).toBe(false);
    expect(isSupportedUrl("about:blank")).toBe(false);
    expect(isSupportedUrl("")).toBe(false);
    expect(isSupportedUrl("   ")).toBe(false);
    expect(isSupportedUrl(undefined)).toBe(false);
  });
});

describe("scanOpenTabs", () => {
  beforeEach(() => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([]);
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);
  });

  it("passes windowId when scanning only the current window", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, windowId: 100, url: "https://example.com", title: "Example" }
    ] as chrome.tabs.Tab[]);

    await scanOpenTabs({ scope: "current_window", windowId: 100 });

    expect(chrome.tabs.query).toHaveBeenCalledWith({ windowId: 100 });
  });

  it("filters unsupported URLs and deduplicates by trimmed URL", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, windowId: 100, url: " https://example.com ", title: "Example" },
      { id: 2, windowId: 100, url: "https://example.com", title: "Duplicate" },
      { id: 3, windowId: 100, url: "chrome://extensions", title: "Unsupported" },
      { id: 4, windowId: 200, url: "https://other.com", title: "Other" }
    ] as chrome.tabs.Tab[]);

    const result = await scanOpenTabs();

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.url)).toEqual(["https://example.com", "https://other.com"]);
  });

  it("uses the URL as a fallback title and null for unknown windows", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: "https://example.com", title: "   " }
    ] as chrome.tabs.Tab[]);

    const [record] = await scanOpenTabs();

    expect(record.tabTitle).toBe("https://example.com");
    expect(record.sourceWindowId).toBeNull();
    expect(record.sourceWindowLabel).toBe("Window unknown");
  });

  it("builds records with stable metadata fields", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 7, windowId: 321, url: "https://example.com/path", title: "Example" }
    ] as chrome.tabs.Tab[]);

    const [record] = await scanOpenTabs();

    expect(record).toMatchObject({
      tabId: "7",
      url: "https://example.com/path",
      tabTitle: "Example",
      sourceWindowId: 321,
      sourceWindowLabel: "Window 321",
      capturedAt: 1_700_000_000_000,
      processingStatus: "pending",
      lastProcessedAt: null,
      lastErrorMessage: null,
      createdAt: 1_700_000_000_000,
      updatedAt: 1_700_000_000_000
    });
    expect(record.id).toBe("rec_1700000000000_4fzzzxjy");
  });

  it("returns an empty list when no eligible tabs are found", async () => {
    vi.mocked(chrome.tabs.query).mockResolvedValue([
      { id: 1, url: "chrome://extensions" },
      { id: 2, title: "Missing URL" }
    ] as chrome.tabs.Tab[]);

    await expect(scanOpenTabs()).resolves.toEqual([]);
  });
});
