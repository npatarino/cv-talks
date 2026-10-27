import { defineConfig } from '@playwright/test';

// Los e2e usan su propio puerto y un deck de fixture temporal (ver
// tests/e2e/start-server.mjs): nunca tocan el editor del usuario en :3001 ni
// los decks reales.
const PORT = Number(process.env.E2E_PORT) || 3101;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: BASE_URL,
    headless: true,
  },
  webServer: {
    command: 'bun tests/e2e/start-server.mjs',
    url: BASE_URL,
    env: { EDITOR_PORT: String(PORT) },
    reuseExistingServer: false,
    timeout: 15_000,
  },
  reporter: [['list']],
});
