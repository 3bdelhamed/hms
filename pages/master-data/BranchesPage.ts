import { expect, type Locator, type Page } from '@playwright/test';

export interface BranchData {
  code: string;
  nameAr: string;
  nameEn: string;
  email?: string;
  phoneCountry?: string;
  phone?: string;
  city?: string;
  country: string;
  language: string;
  currency: string;
  timezone: string;
  defaultBranch?: boolean;
  notes?: string;
}

export class BranchesPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addBranchLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly codeField: Locator;
  private readonly nameArField: Locator;
  private readonly nameEnField: Locator;
  private readonly emailField: Locator;
  private readonly phoneCountryField: Locator;
  private readonly phoneField: Locator;
  private readonly cityField: Locator;
  private readonly notesField: Locator;
  private readonly defaultBranchCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث باسم الفرع…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addBranchLink = page.getByRole('link', { name: 'إضافة فرع جديد' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.codeField = page.locator('#branch-code');
    this.nameArField = page.locator('#branch-name-ar');
    this.nameEnField = page.locator('#branch-name-en');
    this.emailField = page.locator('#branch-email');
    this.phoneCountryField = page.locator('#branch-phone-country');
    this.phoneField = page.locator('#branch-phone');
    this.cityField = page.locator('#branch-city');
    this.notesField = page.locator('#branch-notes');
    this.defaultBranchCheckbox = page.getByLabel('فرع افتراضي');
  }

  async goto() {
    await this.page.goto('/structure/branches/explorer');
  }

  async searchBranch(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateBranch() {
    await this.addBranchLink.click();
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

  async createBranch(data: BranchData) {
    await this.codeField.fill(data.code);
    await this.nameArField.fill(data.nameAr);
    await this.nameEnField.fill(data.nameEn);
    if (data.email !== undefined) await this.emailField.fill(data.email);
    if (data.phoneCountry !== undefined) await this.phoneCountryField.fill(data.phoneCountry);
    if (data.phone !== undefined) await this.phoneField.fill(data.phone);
    if (data.city !== undefined) await this.cityField.fill(data.city);
    await this.selectOption('branch-country', data.country);
    await this.selectOption('branch-language', data.language);
    await this.selectOption('branch-currency', data.currency);
    await this.selectOption('branch-timezone', data.timezone);
    if (data.defaultBranch !== undefined) await this.defaultBranchCheckbox.setChecked(data.defaultBranch);
    if (data.notes !== undefined) await this.notesField.fill(data.notes);
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectBranchInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }

  async editBranch(name: string) {
    await this.row(name).getByRole('button', { name: 'تعديل' }).click();
  }

  async deactivateBranch(name: string) {
    await this.row(name).getByRole('button', { name: 'إلغاء التفعيل' }).click();
  }

  async deleteBranch(name: string) {
    await this.row(name).getByRole('button', { name: 'حذف' }).click();
  }
}
