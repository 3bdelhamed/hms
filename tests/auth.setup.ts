import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  if (!process.env.TEST_USERNAME || !process.env.TEST_PASSWORD) {
    throw new Error('TEST_USERNAME and TEST_PASSWORD must be set in .env');
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(process.env.TEST_USERNAME, process.env.TEST_PASSWORD);

  // SPA redirects /login -> / after successful login.
  await page.waitForURL((url) => url.pathname === '/', { timeout: 20000 });
  await new DashboardPage(page).expectLoaded();

  await page.context().storageState({ path: authFile });
});
