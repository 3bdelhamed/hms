import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Smoke verifies the logged-out login page: ignore the saved auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test('smoke: application loads and shows login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const response = await loginPage.goto();

  // App is reachable.
  expect(response?.ok()).toBe(true);

  // Real login page (not an error/blank page) has loaded.
  await expect(page).toHaveTitle(/Hotel ERP/);
  await expect(loginPage.usernameField).toBeVisible();
  await expect(loginPage.passwordField).toBeVisible();
  await expect(loginPage.loginButton).toBeVisible();
});
