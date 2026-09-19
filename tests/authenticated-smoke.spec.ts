import { test, expect } from '../fixtures/test-fixtures';

// Uses the saved auth state from the setup project (storageState).
// No login steps here on purpose.
test('authenticated smoke: dashboard loads without login @smoke', async ({ dashboardPage, loginPage }) => {
  await dashboardPage.goto();
  await dashboardPage.expectLoaded();

  // Login form must be gone.
  await expect(loginPage.passwordField).toHaveCount(0);
});
