import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'cd ../msse-capstone-backend- && source .venv/bin/activate && python app.py',
      port: 5001,
      reuseExistingServer: true,
      timeout: 15_000,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 15_000,
    },
  ],
})
