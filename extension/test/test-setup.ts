// Test setup file
import { vi } from 'vitest';

// Mock chrome API before any tests run
vi.mock('webextension-polyfill', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runtime: {
      getURL: actual.runtime.getURL,
    },
    tabs: {
      query: vi.fn(),
      create: actual.tabs.create,
    },
  };
});

// Declare chrome globally for use in tests
declare global {
  const chrome: typeof import('@types/chrome');
}

// Create a mock chrome object
const mockChrome: typeof chrome = {
  runtime: {
    getURL: () => 'chrome-extension://test-id/',
  },
  tabs: {
    query: vi.fn(),
    create: vi.fn(),
  },
};

// Inject chrome into the global scope
(globalThis as any).chrome = mockChrome;

// Export for use
export { mockChrome };