import { expect, type Locator, type Page } from '@playwright/test';

export interface RoomData {
  branch: string;
  building: string;
  floor: string;
  category: string;
  number: string;
  physicalStatus?: string;
}

export class RoomsPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addRoomLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly numberField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث برقم الغرفة…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addRoomLink = page.getByRole('link', { name: 'إضافة غرفة جديدة' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.numberField = page.locator('#room-number');
  }

  async goto() {
    await this.page.goto('/structure/rooms/explorer');
  }

  async searchRoom(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateRoom() {
    await this.addRoomLink.click();
  }

  // Selects an ng-select option and verifies the selection is applied.
  // Types into the dropdown search first so the click targets a stable,
  // filtered option (option lists re-render while lookups resolve).
  // If lookupAfterClick is given, waits for the cascade lookup it triggers.
  private async chooseOption(inputId: string, value: string, lookupAfterClick?: RegExp) {
    const panel = this.page.locator(`ng-select[inputid="${inputId}"]`);
    const searchBox = panel.locator('input');
    const matches = this.page.locator('.ng-option', { hasText: value });
    const applied = panel.locator('.ng-value-label', { hasText: value });
    const reloaded = lookupAfterClick
      ? this.page.waitForResponse(lookupAfterClick, { timeout: 30000 })
      : null;
    await panel.click();
    await searchBox.fill(value);
    // Settle gate: proceed only when the filtered list holds exactly our match.
    await expect(matches).toHaveCount(1, { timeout: 15000 });
    await matches.first().click();
    await reloaded;
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

  private async selectOption(inputId: string, value: string, lookupAfterClick?: RegExp) {
    await this.chooseOption(inputId, value, lookupAfterClick);
  }

  // Child select whose options depend on an already-selected parent.
  private async selectChildOption(inputId: string, value: string) {
    await this.chooseOption(inputId, value);
  }

  async createRoom(data: RoomData) {
    await this.selectOption('room-branch', data.branch, /\/api\/building\/lookup/);
    await this.selectChildOption('room-building-filter', data.building);
    await this.selectChildOption('room-floor', data.floor);
    await this.selectChildOption('room-category', data.category);
    await this.numberField.fill(data.number);
    if (data.physicalStatus !== undefined) await this.selectOption('room-physical-status', data.physicalStatus);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  private row(number: string): Locator {
    return this.rows.filter({ hasText: number });
  }

  async expectRoomInList(number: string) {
    await expect(this.row(number)).toBeVisible();
  }

  async editRoom(number: string) {
    await this.row(number).getByRole('button', { name: 'تعديل' }).click();
  }

  async deleteRoom(number: string) {
    await this.row(number).getByRole('button', { name: 'حذف' }).click();
  }
}
