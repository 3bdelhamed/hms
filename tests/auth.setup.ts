import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  if (!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD) {
    throw new Error('TEST_USERNAME and TEST_PASSWORD must be set in .env');
  }

  await page.goto('/');
  await page.locator('#login-email').fill(process.env.TEST_USERNAME);
  await page.locator('#login-password').fill(process.env.TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // SPA redirects /login -> / after successful login.
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
  await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible();

  await page.context().storageState({ path: authFile });
});
