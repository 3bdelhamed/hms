import { test } from '../../fixtures/test-fixtures';
import { GuestsPage } from '../../pages/guests/GuestsPage';
import { uniqueEmail, uniqueName, uniquePhone } from '../../utils/test-data';

// Guest CRUD showcase needs a larger budget than the default 30s.
test.setTimeout(120 * 1000);

test('guests: create, search and edit isolated guest @guests @regression', async ({ page, apiClient, registerCleanup }) => {
  const guests = new GuestsPage(page);

  const firstNameAr = uniqueName('نزيل اختبار');
  const lastNameAr = uniqueName('عائلة اختبار');
  const firstNameEn = uniqueName('Test Guest');
  const lastNameEn = uniqueName('Test Family');
  const updatedLastNameEn = uniqueName('Updated Family');
  const phone = uniquePhone('55');
  const email = uniqueEmail('guest.tst');

  await test.step('Create guest', async () => {
    await guests.goto();
    await guests.openCreateGuest();
    await guests.createGuest({
      firstNameAr,
      lastNameAr,
      firstNameEn,
      lastNameEn,
      gender: 'ذكر',
      nationality: 'Saudi',
      phone,
      email,
    });
    const guestId = await guests.createdGuestId();
    registerCleanup(() => apiClient.deleteGuest(guestId));
  });

  await test.step('Search guest', async () => {
    await guests.goto();
    await guests.searchGuest(firstNameAr);
    await guests.expectGuestInList(firstNameAr);
  });

  await test.step('Edit guest last name', async () => {
    await guests.goto();
    await guests.searchGuest(firstNameAr);
    await guests.openEditGuest(firstNameAr);
    await guests.updateLastNameEn(updatedLastNameEn);
    await guests.saveGuest();
    // List shows Arabic names only; prove persistence by reloading the edit form.
    await guests.goto();
    await guests.searchGuest(firstNameAr);
    await guests.openEditGuest(firstNameAr);
    await guests.expectLastNameEn(updatedLastNameEn);
  });
});
