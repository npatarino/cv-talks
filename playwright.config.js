import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.EDITOR_PORT) || 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  webServer: {
    command: 'bun editor/server.mjs',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
  reporter: [['list']],
});
