import { expect, type Locator, type Page } from '@playwright/test';

export interface RoomCategoryData {
  branches?: string;
  code: string;
  displayOrder: number;
  nameAr: string;
  nameEn: string;
  color?: string;
  description?: string;
  maxAdults?: number;
  maxChildren?: number;
  maxInfants?: number;
  maxOccupancy?: number;
  defaultAdults?: number;
  defaultChildren?: number;
  standardBedCapacity?: number;
  maxExtraBeds?: number;
  maxChildrenSharing?: number;
  maxBabyCots?: number;
}

export class RoomCategoriesPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addCategoryLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly displayOrderField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly colorField: Locator;
  private readonly descriptionField: Locator;
  private readonly maxAdultsField: Locator;
  private readonly maxChildrenField: Locator;
  private readonly maxInfantsField: Locator;
  private readonly maxOccupancyField: Locator;
  private readonly defaultAdultsField: Locator;
  private readonly defaultChildrenField: Locator;
  private readonly standardBedCapacityField: Locator;
  private readonly maxExtraBedsField: Locator;
  private readonly maxChildrenSharingField: Locator;
  private readonly maxBabyCotsField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم الفئة…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addCategoryLink = page.getByRole('link', { name: 'إضافة فئة غرفة جديدة' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#room-category-code');
    this.displayOrderField = page.locator('#room-category-display-order');
    this.nameArField = page.locator('#room-category-name-ar');
    this.nameEnField = page.locator('#room-category-name-en');
    this.colorField = page.locator('#room-category-color');
    this.descriptionField = page.locator('#room-category-description');
    this.maxAdultsField = page.locator('#room-category-max-adults');
    this.maxChildrenField = page.locator('#room-category-max-children');
    this.maxInfantsField = page.locator('#room-category-max-infants');
    this.maxOccupancyField = page.locator('#room-category-max-occupancy');
    this.defaultAdultsField = page.locator('#room-category-default-adults');
    this.defaultChildrenField = page.locator('#room-category-default-children');
    this.standardBedCapacityField = page.locator('#room-category-standard-bed-capacity');
    this.maxExtraBedsField = page.locator('#room-category-max-extra-beds');
    this.maxChildrenSharingField = page.locator('#room-category-max-children-sharing');
    this.maxBabyCotsField = page.locator('#room-category-max-baby-cots');
  }

  async goto() {
    await this.page.goto('/structure/room-categories/explorer');
  }

  async searchCategory(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateCategory() {
    await this.addCategoryLink.click();
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

  private async fillNumber(field: Locator, value: number | undefined) {
    if (value !== undefined) await field.fill(String(value));
  }

  async createCategory(data: RoomCategoryData) {
    if (data.branches !== undefined) await this.selectOption('room-category-branches', data.branches);
    await this.codeField.fill(data.code);
    await this.displayOrderField.fill(String(data.displayOrder));
    await this.nameArField.fill(data.nameAr);
    await this.nameEnField.fill(data.nameEn);
    if (data.color !== undefined) await this.colorField.fill(data.color);
    if (data.description !== undefined) await this.descriptionField.fill(data.description);
    await this.fillNumber(this.maxAdultsField, data.maxAdults);
    await this.fillNumber(this.maxChildrenField, data.maxChildren);
    await this.fillNumber(this.maxInfantsField, data.maxInfants);
    await this.fillNumber(this.maxOccupancyField, data.maxOccupancy);
    await this.fillNumber(this.defaultAdultsField, data.defaultAdults);
    await this.fillNumber(this.defaultChildrenField, data.defaultChildren);
    await this.fillNumber(this.standardBedCapacityField, data.standardBedCapacity);
    await this.fillNumber(this.maxExtraBedsField, data.maxExtraBeds);
    await this.fillNumber(this.maxChildrenSharingField, data.maxChildrenSharing);
    await this.fillNumber(this.maxBabyCotsField, data.maxBabyCots);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectCategoryInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }

  async editCategory(name: string) {
    await this.row(name).getByRole('button', { name: 'تعديل' }).click();
  }

  async deactivateCategory(name: string) {
    await this.row(name).getByRole('button', { name: 'إلغاء التفعيل' }).click();
  }

  async deleteCategory(name: string) {
    await this.row(name).getByRole('button', { name: 'حذف' }).click();
  }
}
