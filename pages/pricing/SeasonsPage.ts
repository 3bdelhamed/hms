import { expect, type Locator, type Page } from '@playwright/test';

export interface SeasonData {
  code: string;
  priority: number;
  nameAr: string;
  nameEn?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export class SeasonsPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addSeasonLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly priorityField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly startDateField: Locator;
  private readonly endDateField: Locator;
  private readonly descriptionField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم الموسم…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addSeasonLink = page.getByRole('link', { name: 'إضافة موسم جديد' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#season-code');
    this.priorityField = page.locator('#season-priority');
    this.nameArField = page.locator('#season-name-ar');
    this.nameEnField = page.locator('#season-name-en');
    this.startDateField = page.locator('#season-start-date');
    this.endDateField = page.locator('#season-end-date');
    this.descriptionField = page.locator('#season-description');
  }

  async goto() {
    await this.page.goto('/pricing/seasons/explorer');
  }

  async searchSeason(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateSeason() {
    await this.addSeasonLink.click();
  }

  async createSeason(data: SeasonData) {
    await this.codeField.fill(data.code);
    await this.priorityField.fill(String(data.priority));
    await this.nameArField.fill(data.nameAr);
    if (data.nameEn !== undefined) await this.nameEnField.fill(data.nameEn);
    if (data.startDate !== undefined) await this.startDateField.fill(data.startDate);
    if (data.endDate !== undefined) await this.endDateField.fill(data.endDate);
    if (data.description !== undefined) await this.descriptionField.fill(data.description);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  /** Numeric record id parsed from the post-save URL (e.g. /seasons/3/edit). */
  async createdId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No season id found in URL: ' + this.page.url());
    return match[1];
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectSeasonInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }
}
