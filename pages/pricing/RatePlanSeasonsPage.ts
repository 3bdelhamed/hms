import { expect, type Locator, type Page } from '@playwright/test';

export interface RatePlanSeasonData {
  ratePlan: string;
  season: string;
  roomType?: string;
  priority: number;
  price: number;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export class RatePlanSeasonsPage {
  private readonly page: Page;
  private readonly addLink: Locator;
  private readonly rows: Locator;
  private readonly saveButton: Locator;
  private readonly priorityField: Locator;
  private readonly priceField: Locator;
  private readonly effectiveFromField: Locator;
  private readonly effectiveToField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addLink = page.getByRole('link', { name: 'إضافة موسم خطة سعر جديد' });
    this.rows = page.locator('tbody tr');
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.priorityField = page.locator('#rate-plan-season-priority');
    this.priceField = page.locator('#rate-plan-season-price');
    this.effectiveFromField = page.locator('#rate-plan-season-effective-from');
    this.effectiveToField = page.locator('#rate-plan-season-effective-to');
  }

  async goto() {
    await this.page.goto('/pricing/rate-plan-seasons/explorer');
  }

  async openCreate() {
    await this.addLink.click();
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

  async createRatePlanSeason(data: RatePlanSeasonData) {
    await this.selectOption('rate-plan-season-rate-plan', data.ratePlan);
    await this.selectOption('rate-plan-season-season', data.season);
    if (data.roomType !== undefined) await this.selectOption('rate-plan-season-room-type', data.roomType);
    await this.priorityField.fill(String(data.priority));
    await this.priceField.fill(String(data.price));
    // Effective dates lock once a season is selected (they derive from the
    // season); fill them only when the application leaves them enabled.
    if (data.effectiveFrom !== undefined && (await this.effectiveFromField.isEnabled())) {
      await this.effectiveFromField.fill(data.effectiveFrom);
    }
    if (data.effectiveTo !== undefined && (await this.effectiveToField.isEnabled())) {
      await this.effectiveToField.fill(data.effectiveTo);
    }
    await this.saveButton.click();
    // App navigates to the new record's edit page only after the save completes.
    await this.page.waitForURL(/\/edit$/, { timeout: 20000 });
  }

  /** Numeric record id parsed from the post-save URL. */
  async createdId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No rate plan season id found in URL: ' + this.page.url());
    return match[1];
  }

  async expectRatePlanSeasonInList(planName: string) {
    await expect(this.rows.filter({ hasText: planName })).toBeVisible();
  }
}
