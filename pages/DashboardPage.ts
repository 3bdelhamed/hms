import { expect, type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardHeading = page.getByRole('heading', { name: 'لوحة التحكم' });
  }

  async goto() {
    await this.page.goto('/');
  }

  // Page-state assertion: proves the authenticated dashboard has loaded.
  async expectLoaded() {
    await expect(this.dashboardHeading).toBeVisible();
  }
}
