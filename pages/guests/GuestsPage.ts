import { expect, type Locator, type Page } from '@playwright/test';

export interface GuestData {
  firstNameAr: string;
  middleNameAr?: string;
  lastNameAr: string;
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  gender: string;
  nationality: string;
  birthDate?: string;
  phoneCountry?: string;
  phone?: string;
  email?: string;
  passportNumber?: string;
  nationalId?: string;
  notes?: string;
}

export class GuestsPage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly searchButton: Locator;
  private readonly addGuestLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly editSaveButton: Locator;
  private readonly firstNameArField: Locator;
  private readonly middleNameArField: Locator;
  private readonly lastNameArField: Locator;
  private readonly firstNameEnField: Locator;
  private readonly middleNameEnField: Locator;
  private readonly lastNameEnField: Locator;
  private readonly birthDateField: Locator;
  private readonly phoneCountryField: Locator;
  private readonly phoneField: Locator;
  private readonly emailField: Locator;
  private readonly passportField: Locator;
  private readonly nationalIdField: Locator;
  private readonly notesField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.getByPlaceholder('بحث بـالاسم بالعربية…');
    this.searchButton = page.getByRole('button', { name: 'بحث', exact: true });
    this.addGuestLink = page.getByRole('link', { name: 'إضافة نزيل جديد' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.editSaveButton = page.getByRole('button', { name: 'تعديل', exact: true });
    this.firstNameArField = page.locator('#guest-first-name-ar');
    this.middleNameArField = page.locator('#guest-middle-name-ar');
    this.lastNameArField = page.locator('#guest-last-name-ar');
    this.firstNameEnField = page.locator('#guest-first-name-en');
    this.middleNameEnField = page.locator('#guest-middle-name-en');
    this.lastNameEnField = page.locator('#guest-last-name-en');
    this.birthDateField = page.locator('#guest-birth-date');
    this.phoneCountryField = page.locator('#guest-primary-phone-country');
    this.phoneField = page.locator('#guest-primary-phone');
    this.emailField = page.locator('#guest-primary-email');
    this.passportField = page.locator('#guest-passport-number');
    this.nationalIdField = page.locator('#guest-national-id');
    this.notesField = page.locator('#guest-notes');
  }

  async goto() {
    await this.page.goto('/guests');
  }

  async searchGuest(query: string) {
    await this.searchBox.fill(query);
    await this.searchButton.click();
  }

  async openCreateGuest() {
    await this.addGuestLink.click();
  }

  private async selectOptionByControl(controlName: string, value: string) {
    const panel = this.page.locator(`ng-select[formcontrolname="${controlName}"]`);
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

  async createGuest(data: GuestData) {
    await this.firstNameArField.fill(data.firstNameAr);
    if (data.middleNameAr !== undefined) await this.middleNameArField.fill(data.middleNameAr);
    await this.lastNameArField.fill(data.lastNameAr);
    await this.firstNameEnField.fill(data.firstNameEn);
    if (data.middleNameEn !== undefined) await this.middleNameEnField.fill(data.middleNameEn);
    await this.lastNameEnField.fill(data.lastNameEn);
    await this.selectOption('guest-gender', data.gender);
    await this.selectOptionByControl('nationalityId', data.nationality);
    if (data.birthDate !== undefined) await this.birthDateField.fill(data.birthDate);
    if (data.phoneCountry !== undefined) await this.phoneCountryField.fill(data.phoneCountry);
    if (data.phone !== undefined) await this.phoneField.fill(data.phone);
    if (data.email !== undefined) await this.emailField.fill(data.email);
    if (data.passportNumber !== undefined) await this.passportField.fill(data.passportNumber);
    if (data.nationalId !== undefined) await this.nationalIdField.fill(data.nationalId);
    if (data.notes !== undefined) await this.notesField.fill(data.notes);
    await this.saveButton.click();
    // App leaves the add page only after the save completes.
    await this.page.waitForURL((url) => !url.pathname.endsWith('/add'), { timeout: 20000 });
  }

  /** Numeric record id parsed from the post-save URL (e.g. /guests/10/edit). */
  async createdGuestId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No guest id found in URL: ' + this.page.url());
    return match[1];
  }

  private row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async expectGuestInList(name: string) {
    await expect(this.row(name)).toBeVisible();
  }

  async openEditGuest(name: string) {
    await this.row(name).getByRole('button', { name: 'تعديل' }).click();
  }

  async updateLastNameEn(value: string) {
    await this.lastNameEnField.fill(value);
  }

  async saveGuest() {
    // Edit page stays on /guests/:id/edit after save; sync on the update request.
    const saved = this.page.waitForResponse(/\/api\/guests/, { timeout: 30000 });
    await this.editSaveButton.click();
    await saved;
  }

  async expectLastNameEn(value: string) {
    await expect(this.lastNameEnField).toHaveValue(value);
  }
}
