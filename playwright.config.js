import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run start --prefix backend',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 60000,
    },
    {
      command: 'npx vite preview frontend --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
