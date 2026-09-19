import { expect, type Locator, type Page } from '@playwright/test';

export interface PackageData {
  code: string;
  unitPrice: number;
  nameAr: string;
  nameEn?: string;
  description?: string;
}

export class PackagesPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addPackageLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly unitPriceField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly descriptionField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم الباقة…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addPackageLink = page.getByRole('link', { name: 'إضافة باقة جديدة' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#package-code');
    this.unitPriceField = page.locator('#package-unit-price');
    this.nameArField = page.locator('#package-name-ar');
    this.nameEnField = page.locator('#package-name-en');
    this.descriptionField = page.locator('#package-description');
  }

  async goto() {
    await this.page.goto('/pricing/packages/explorer');
  }

  async searchPackage(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreatePackage() {
    await this.addPackageLink.click();
  }

  async createPackage(data: PackageData) {
    await this.codeField.fill(data.code);
    await this.unitPriceField.fill(String(data.unitPrice));
    await this.nameArField.fill(data.nameAr);
    if (data.nameEn !== undefined) await this.nameEnField.fill(data.nameEn);
    if (data.description !== undefined) await this.descriptionField.fill(data.description);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  /** Numeric record id parsed from the post-save URL (e.g. /packages/5/edit). */
  async createdId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No package id found in URL: ' + this.page.url());
    return match[1];
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectPackageInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }
}
