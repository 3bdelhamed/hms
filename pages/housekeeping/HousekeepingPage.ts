import { expect, type Locator, type Page } from '@playwright/test';

export interface HousekeepingTaskData {
  room: string;
  type: string;
  priority: string;
  employee?: string;
  remarks?: string;
}

export class HousekeepingPage {
  private readonly page: Page;
  private readonly addTaskButton: Locator;
  private readonly saveButton: Locator;
  private readonly editSaveButton: Locator;
  private readonly remarksField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addTaskButton = page.getByRole('button', { name: 'مهمة جديدة' });
    this.saveButton = page.getByRole('button', { name: 'حفظ', exact: true });
    this.editSaveButton = page.getByRole('button', { name: 'تعديل', exact: true });
    this.remarksField = page.locator('#housekeeping-remarks');
  }

  async goto() {
    await this.page.goto('/operations/housekeeping');
  }

  async openCreateTask() {
    await this.addTaskButton.click();
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

  async createTask(data: HousekeepingTaskData) {
    await this.selectOption('housekeeping-room', data.room);
    await this.selectOption('housekeeping-task-type', data.type);
    await this.selectOption('housekeeping-priority', data.priority);
    if (data.employee !== undefined) await this.selectOption('housekeeping-employee', data.employee);
    if (data.remarks !== undefined) await this.remarksField.fill(data.remarks);
    await this.saveButton.click();
    // App leaves the creation page only after the save completes.
    await this.page.waitForURL((url) => !url.pathname.endsWith('/new'), { timeout: 20000 });
  }

  /** Task id parsed from the post-save URL (e.g. /housekeeping/12/edit). */
  async createdTaskId(): Promise<string> {
    const match = new URL(this.page.url()).pathname.match(/\/(\d+)(?:\/|$)/);
    if (!match) throw new Error('No task id found in URL: ' + this.page.url());
    return match[1];
  }

  // Task id lives in the second table cell; match it exactly so small ids
  // never collide with the row-number column or room numbers.
  private row(id: string): Locator {
    return this.page.locator(`tbody tr:has(td:nth-child(2):text-is("${id}"))`);
  }

  async expectTaskWithStatus(id: string, status: string) {
    await expect(this.row(id)).toContainText(status);
  }

  async openEditTask(id: string) {
    await this.row(id).getByRole('button', { name: 'تعديل' }).click();
  }

  async updatePriority(priority: string) {
    await this.selectOption('housekeeping-priority', priority);
  }

  async saveTask() {
    // Edit page has no حفظ button; edits submit via تعديل and stay on the page.
    const saved = this.page.waitForResponse(/\/api\/housekeeping/, { timeout: 30000 });
    await this.editSaveButton.click();
    await saved;
  }

  async completeTask(id: string) {
    await this.row(id).getByRole('button', { name: 'إكمال' }).click();
    // Confirm dialog asks once; the dialog must close to prove confirmation applied.
    const dialog = this.page.locator('[role=dialog]');
    const confirm = dialog.getByRole('button', { name: 'إكمال', exact: true });
    await confirm.click();
    try {
      await expect(dialog).toBeHidden({ timeout: 10000 });
    } catch {
      // Single recovery attempt: confirm once more, then fail loud.
      await confirm.click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  }

  async expectTaskCompleted(id: string) {
    const taskRow = this.row(id);
    await expect(taskRow).toContainText('مكتملة');
    const text = await taskRow.innerText();
    const dates = text.match(/\d{2}-\d{2}-\d{4}/g) ?? [];
    // Created + completed timestamps.
    expect(dates.length).toBeGreaterThanOrEqual(2);
  }
}
