import { test, expect } from '@playwright/test';

// Uses the saved auth state from the setup project (storageState).
// No login steps here on purpose.
test('authenticated smoke: dashboard loads without login', async ({ page }) => {
  await page.goto('/');

  // Dashboard heading exists only after login.
  await expect(page.getByRole('heading', { name: 'لوحة التحكم' })).toBeVisible();
  // Login form must be gone.
  await expect(page.locator('#login-password')).toHaveCount(0);
});
