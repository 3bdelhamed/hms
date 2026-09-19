import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // 30s per test. Enough for hosted apps without hiding real hangs.
  timeout: 30 * 1000,

  expect: {
    // 5s for expect() retries (assertions, not arbitrary sleeps).
    timeout: 5 * 1000,
  },

  // Run test files in parallel.
  fullyParallel: true,

  // 1 worker locally (easier to debug). Override with: npx playwright test --workers=4
  // In CI use 2 workers for speed.
  workers: process.env.CI ? 2 : 1,

  // Retry only in CI to avoid masking flakiness locally.
  retries: process.env.CI ? 2 : 0,

  reporter: 'html',

  use: {
    // Set via env, e.g. $env:BASE_URL="<your-app-url>" (PowerShell).
    baseURL: process.env.BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      // Setup files run only via the setup project dependency, never as regular tests.
      testIgnore: /.*\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
