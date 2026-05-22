import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.mjs', 'tests/integration/**/*.test.mjs'],
    coverage: {
      provider: 'v8',
      include: ['editor/api/**'],
      reporter: ['text', 'html'],
    },
  },
});
