import { test } from '../../fixtures/test-fixtures';
import { HousekeepingPage } from '../../pages/housekeeping/HousekeepingPage';
import { uniqueName } from '../../utils/test-data';

// Task lifecycle needs a larger budget than the default 30s.
test.setTimeout(120 * 1000);

test('housekeeping: task lifecycle on isolated task @housekeeping @regression', async ({ page, apiClient, registerCleanup }) => {
  const housekeeping = new HousekeepingPage(page);
  const remarks = uniqueName('HK task');

  let taskId = '';

  await test.step('Create task', async () => {
    await housekeeping.goto();
    await housekeeping.openCreateTask();
    await housekeeping.createTask({
      room: '101',
      type: 'تنظيف عادي',
      priority: 'عادية',
      employee: 'Ahmed Housekeeping (HK-001)',
      remarks,
    });
    taskId = await housekeeping.createdTaskId();
    registerCleanup(() => apiClient.deleteHousekeepingTask(taskId));
  });

  await test.step('Verify pending task', async () => {
    await housekeeping.goto();
    await housekeeping.expectTaskWithStatus(taskId, 'قيد الانتظار');
  });

  await test.step('Edit task priority', async () => {
    await housekeeping.goto();
    await housekeeping.openEditTask(taskId);
    await housekeeping.updatePriority('مرتفعة');
    await housekeeping.saveTask();
    await housekeeping.goto();
    await housekeeping.expectTaskWithStatus(taskId, 'مرتفعة');
  });

  await test.step('Complete task', async () => {
    await housekeeping.goto();
    await housekeeping.completeTask(taskId);
    await housekeeping.goto();
    await housekeeping.expectTaskCompleted(taskId);
  });
});
