import { expect, type Locator, type Page } from '@playwright/test';

export interface BuildingData {
  branch: string;
  code: string;
  nameAr: string;
  nameEn: string;
  floors: number;
  description?: string;
}

export class BuildingsPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addBuildingLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly floorsField: Locator;
  private readonly descriptionField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم المبنى…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addBuildingLink = page.getByRole('link', { name: 'إضافة مبنى جديد' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#building-code');
    this.nameArField = page.locator('#building-name-ar');
    this.nameEnField = page.locator('#building-name-en');
    this.floorsField = page.locator('#building-floors');
    this.descriptionField = page.locator('#building-description');
  }

  async goto() {
    await this.page.goto('/structure/buildings/explorer');
  }

  async searchBuilding(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateBuilding() {
    await this.addBuildingLink.click();
  }

  // Selects an ng-select option and verifies the selection is applied.
  // Types into the dropdown search first so the click targets a stable,
  // filtered option (option lists re-render while lookups resolve).
  private async selectOption(inputId: string, value: string) {
    const panel = this.page.locator(`ng-select[inputid="${inputId}"]`);
    const searchBox = panel.locator('input');
    const matches = this.page.locator('.ng-option', { hasText: value });
    const applied = panel.locator('.ng-value-label', { hasText: value });
    await panel.click();
    await searchBox.fill(value);
    // Settle gate: proceed only when the filtered list holds exactly our match.
    await expect(matches).toHaveCount(1, { timeout: 15000 });
    await matches.first().click();
    await this.page.keyboard.press('Escape');
    try {
      await expect(applied).toBeVisible({ timeout: 10000 });
    } catch {
      // Single recovery attempt: re-select once, then fail loud if still unapplied.
      await panel.click();
      await searchBox.fill(value);
      await expect(matches).toHaveCount(1, { timeout: 15000 });
      await matches.first().click();
      await this.page.keyboard.press('Escape');
      await expect(applied).toBeVisible({ timeout: 10000 });
    }
  }

  async createBuilding(data: BuildingData) {
    await this.selectOption('building-branch', data.branch);
    await this.codeField.fill(data.code);
    await this.nameArField.fill(data.nameAr);
    await this.nameEnField.fill(data.nameEn);
    await this.floorsField.fill(String(data.floors));
    if (data.description !== undefined) await this.descriptionField.fill(data.description);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectBuildingInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }

  async editBuilding(name: string) {
    await this.row(name).getByRole('button', { name: 'تعديل' }).click();
  }

  async deactivateBuilding(name: string) {
    await this.row(name).getByRole('button', { name: 'إلغاء التفعيل' }).click();
  }

  async deleteBuilding(name: string) {
    await this.row(name).getByRole('button', { name: 'حذف' }).click();
  }
}
