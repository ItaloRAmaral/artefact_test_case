import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: 'e2e',
  workers: 1,
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
    command: 'pnpm build && pnpm start',
    env: { PORT: String(PORT), HOSTNAME: 'localhost' },
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
