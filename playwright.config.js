import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:3001',
    headless: true,
  },
  webServer: {
    command: 'bun editor/server.mjs',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
  reporter: [['list']],
});
