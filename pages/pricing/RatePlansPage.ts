import { expect, type Locator, type Page } from '@playwright/test';

export interface RatePlanData {
  code: string;
  displayOrder: number;
  nameAr: string;
  nameEn?: string;
  basePrice: number;
  minimumStay: number;
  maximumStay: number;
  description?: string;
}

export class RatePlansPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addRatePlanLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly displayOrderField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly basePriceField: Locator;
  private readonly minimumStayField: Locator;
  private readonly maximumStayField: Locator;
  private readonly descriptionField: Locator;
  private readonly basePriceHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم خطة السعر…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addRatePlanLink = page.getByRole('link', { name: 'إضافة خطة سعر جديدة' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#rate-plan-code');
    this.displayOrderField = page.locator('#rate-plan-display-order');
    this.nameArField = page.locator('#rate-plan-name-ar');
    this.nameEnField = page.locator('#rate-plan-name-en');
    this.basePriceField = page.locator('#rate-plan-base-price');
    this.minimumStayField = page.locator('#rate-plan-minimum-stay');
    this.maximumStayField = page.locator('#rate-plan-maximum-stay');
    this.descriptionField = page.locator('#rate-plan-description');
    this.basePriceHeader = page.locator('th', { hasText: 'السعر الأساسي' });
  }

  async goto() {
    await this.page.goto('/pricing/rate-plans/explorer');
  }

  async searchRatePlan(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateRatePlan() {
    await this.addRatePlanLink.click();
  }

  async createRatePlan(data: RatePlanData) {
    await this.codeField.fill(data.code);
    await this.displayOrderField.fill(String(data.displayOrder));
    await this.nameArField.fill(data.nameAr);
    if (data.nameEn !== undefined) await this.nameEnField.fill(data.nameEn);
    await this.basePriceField.fill(String(data.basePrice));
    await this.minimumStayField.fill(String(data.minimumStay));
    await this.maximumStayField.fill(String(data.maximumStay));
    if (data.description !== undefined) await this.descriptionField.fill(data.description);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  /** Numeric record id parsed from the post-save URL (e.g. /rate-plans/4/edit). */
  async createdId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No rate plan id found in URL: ' + this.page.url());
    return match[1];
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectRatePlanInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }

  async sortByBasePrice() {
    await this.basePriceHeader.click();
  }

  async basePriceSortDirection(): Promise<string | null> {
    return this.basePriceHeader.getAttribute('aria-sort');
  }
}
