import { test, expect } from '@playwright/test';

// Smoke verifies the logged-out login page: ignore the saved auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test('smoke: application loads and shows login', async ({ page }) => {
  const response = await page.goto('/');

  // App is reachable.
  expect(response?.ok()).toBe(true);

  // Real login page (not an error/blank page) has loaded.
  await expect(page).toHaveTitle(/Hotel ERP/);
  await expect(page.locator('#login-email')).toBeVisible();
  await expect(page.locator('#login-password')).toBeVisible();
  await expect(page.getByRole('button', { name: /تسجيل الدخول/ })).toBeVisible();
});
