type BrowserAPI = typeof chrome;
export const api: BrowserAPI =
  (globalThis as any).browser ?? (globalThis as any).chrome;
