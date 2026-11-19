import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${String(PORT)}`;

// e2e tests run against a production build that Playwright starts itself, never a
// server already running: SSR is only meaningful in a production build, and a fresh
// server means an empty in-memory task list on every run (DECISIONS D-18).
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: BASE_URL,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${String(PORT)}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
