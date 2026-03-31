import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/test-setup.ts'],
    include: ['test/**/*.test.ts'],
  },
});