import { expect, test } from '../../fixtures/test-fixtures';
import { RoomCategoriesPage } from '../../pages/master-data/RoomCategoriesPage';
import { SeasonsPage } from '../../pages/pricing/SeasonsPage';
import { RatePlansPage } from '../../pages/pricing/RatePlansPage';
import { PackagesPage } from '../../pages/pricing/PackagesPage';
import { RatePlanSeasonsPage } from '../../pages/pricing/RatePlanSeasonsPage';
import { futureDateInput, futureDateTimeInput, uniqueCode, uniqueName } from '../../utils/test-data';

// Eight-entity showcase needs a larger budget than the default 30s.
test.setTimeout(180 * 1000);

test('pricing: seasons, rate plans, packages and rate plan season @pricing @regression', async ({ page, apiClient, registerCleanup }) => {
  const seasons = new SeasonsPage(page);
  const plans = new RatePlansPage(page);
  const packages = new PackagesPage(page);
  const categories = new RoomCategoriesPage(page);
  const planSeasons = new RatePlanSeasonsPage(page);

  const seasonCode = uniqueCode('SN');
  const seasonNameAr = uniqueName('موسم اختبار');
  const seasonNameEn = uniqueName('Test Season');
  const planCode = uniqueCode('RP');
  const planNameAr = uniqueName('خطة سعر اختبار');
  const planNameEn = uniqueName('Test Rate Plan');
  const packageCode = uniqueCode('PKG');
  const packageNameAr = uniqueName('باقة اختبار');
  const packageNameEn = uniqueName('Test Package');
  const categoryCode = uniqueCode('RC');
  const categoryNameAr = uniqueName('فئة اختبار');
  const categoryNameEn = uniqueName('Test Category');
  // Pricing cleanups deactivate (reversible) rather than hard-delete.
  // Registered per entity right after creation so partial runs still clean up.
  // Teardown runs LIFO: the rate plan season (dependent) is always removed first;
  // plan/season/package are mutually independent.
  let seasonId = '';
  let planId = '';
  let packageId = '';
  let planSeasonId = '';

  await test.step('Create season', async () => {
    await seasons.goto();
    await seasons.openCreateSeason();
    await seasons.createSeason({
      code: seasonCode,
      priority: 5,
      nameAr: seasonNameAr,
      nameEn: seasonNameEn,
      startDate: futureDateInput(30),
      endDate: futureDateInput(90),
    });
    seasonId = await seasons.createdId();
    registerCleanup(() => apiClient.deactivateSeason(seasonId));
    await seasons.goto();
    await seasons.searchSeason(seasonNameAr);
    await seasons.expectSeasonInList(seasonNameAr);
  });

  await test.step('Create rate plan', async () => {
    await plans.goto();
    await plans.openCreateRatePlan();
    await plans.createRatePlan({
      code: planCode,
      displayOrder: 50,
      nameAr: planNameAr,
      nameEn: planNameEn,
      basePrice: 500,
      minimumStay: 1,
      maximumStay: 10,
    });
    planId = await plans.createdId();
    registerCleanup(() => apiClient.deactivateRatePlan(planId));
    await plans.goto();
    await plans.searchRatePlan(planNameAr);
    await plans.expectRatePlanInList(planNameAr);
  });

  await test.step('Create package', async () => {
    await packages.goto();
    await packages.openCreatePackage();
    await packages.createPackage({
      code: packageCode,
      unitPrice: 99,
      nameAr: packageNameAr,
      nameEn: packageNameEn,
    });
    packageId = await packages.createdId();
    registerCleanup(() => apiClient.deactivatePackage(packageId));
    await packages.goto();
    await packages.searchPackage(packageNameAr);
    await packages.expectPackageInList(packageNameAr);
  });

  await test.step('Search rate plan', async () => {
    await plans.goto();
    await plans.searchRatePlan(planNameAr);
    await plans.expectRatePlanInList(planNameAr);
  });

  await test.step('Sort by base price', async () => {
    // Header cycles ascending -> descending -> none; step to a directional state.
    const directional = async () => {
      await plans.sortByBasePrice();
      let dir = await plans.basePriceSortDirection();
      if (dir !== 'ascending' && dir !== 'descending') {
        await plans.sortByBasePrice();
        dir = await plans.basePriceSortDirection();
      }
      return dir;
    };
    await plans.goto();
    const first = await directional();
    expect(first).toMatch(/ascending|descending/);
    const second = await directional();
    expect(second).toMatch(/ascending|descending/);
    expect(second).not.toBe(first);
  });

  await test.step('Create room category', async () => {
    await categories.goto();
    await categories.openCreateCategory();
    await categories.createCategory({
      code: categoryCode,
      displayOrder: 10,
      nameAr: categoryNameAr,
      nameEn: categoryNameEn,
      maxAdults: 2,
      maxChildren: 2,
      maxOccupancy: 4,
      defaultAdults: 2,
    });
    await categories.goto();
    await categories.searchCategory(categoryNameAr);
    await categories.expectCategoryInList(categoryNameAr);
  });

  await test.step('Create rate plan season', async () => {
    await planSeasons.goto();
    await planSeasons.openCreate();
    await planSeasons.createRatePlanSeason({
      ratePlan: planNameAr,
      season: seasonNameEn,
      roomType: categoryNameAr,
      priority: 1,
      price: 450,
      effectiveFrom: futureDateTimeInput(30, 14, 0),
      effectiveTo: futureDateTimeInput(90, 12, 0),
    });
    planSeasonId = await planSeasons.createdId();
    registerCleanup(() => apiClient.deactivateRatePlanSeason(planSeasonId));
    await planSeasons.goto();
    await planSeasons.expectRatePlanSeasonInList(planNameEn);
  });
});
