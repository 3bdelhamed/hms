import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ApiClient } from '../utils/api-client';

export type CleanupTask = () => Promise<void>;

type Fixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  apiClient: ApiClient;
  registerCleanup: (task: CleanupTask) => void;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  // NOTE: request apiClient before registerCleanup in test signatures so that
  // teardown runs cleanups first (reverse setup order) while the client is alive.
  apiClient: async ({ page }, use) => {
    const client = await ApiClient.fromPage(page);
    await use(client);
    await client.dispose();
  },
  registerCleanup: async ({}, use) => {
    const tasks: CleanupTask[] = [];
    await use((task: CleanupTask) => {
      tasks.push(task);
    });
    // Teardown runs LIFO so the most recently created record is cleaned first.
    const failures: string[] = [];
    for (const task of tasks.reverse()) {
      try {
        await task();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(message);
        console.error(`cleanup failed: ${message}`);
      }
    }
    if (failures.length > 0) {
      throw new Error(`Cleanup failed (${failures.length}): ${failures.join(' | ')}`);
    }
  },
});

export { expect } from '@playwright/test';
