import { beforeEach, vi } from "vitest";

const runtime = {
  getURL: vi.fn((path = "") => `chrome-extension://test-id/${path}`),
  sendMessage: vi.fn(),
  onInstalled: { addListener: vi.fn() },
  onMessage: { addListener: vi.fn() }
};

const tabs = {
  query: vi.fn(),
  create: vi.fn(),
  remove: vi.fn()
};

const windowsApi = {
  getCurrent: vi.fn()
};

const storage = {
  local: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  }
};

const downloads = {
  download: vi.fn()
};

const chromeMock = {
  runtime,
  tabs,
  windows: windowsApi,
  storage,
  downloads
};

(globalThis as Record<string, unknown>).chrome = chromeMock;
(globalThis as Record<string, unknown>).browser = chromeMock;

beforeEach(() => {
  vi.clearAllMocks();
  runtime.getURL.mockImplementation((path = "") => `chrome-extension://test-id/${path}`);
  tabs.query.mockResolvedValue([]);
  tabs.create.mockResolvedValue({});
  tabs.remove.mockResolvedValue(undefined);
  windowsApi.getCurrent.mockResolvedValue({ id: 1 });
  storage.local.get.mockResolvedValue({});
  storage.local.set.mockResolvedValue(undefined);
  storage.local.remove.mockResolvedValue(undefined);
  downloads.download.mockResolvedValue(1);
  runtime.sendMessage.mockResolvedValue({ ok: true });
});

export { chromeMock };
