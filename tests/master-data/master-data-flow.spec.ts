import { test } from '../../fixtures/test-fixtures';
import { BranchesPage } from '../../pages/master-data/BranchesPage';
import { BuildingsPage } from '../../pages/master-data/BuildingsPage';
import { FloorsPage } from '../../pages/master-data/FloorsPage';
import { RoomCategoriesPage } from '../../pages/master-data/RoomCategoriesPage';
import { RoomsPage } from '../../pages/master-data/RoomsPage';
import { uniqueCode, uniqueName } from '../../utils/test-data';

// Five-entity creation chain needs a larger budget than the default 30s.
test.setTimeout(180 * 1000);

test('master data: create branch to room chain @master-data @regression', async ({ page }) => {
  const branches = new BranchesPage(page);
  const buildings = new BuildingsPage(page);
  const floors = new FloorsPage(page);
  const categories = new RoomCategoriesPage(page);
  const rooms = new RoomsPage(page);

  const branchCode = uniqueCode('BR');
  const branchNameAr = uniqueName('فرع اختبار');
  const branchNameEn = uniqueName('Test Branch');
  const buildingCode = uniqueCode('BLD');
  const buildingNameAr = uniqueName('مبنى اختبار');
  const buildingNameEn = uniqueName('Test Building');
  const floorCode = uniqueCode('FL');
  const floorNameAr = uniqueName('طابق اختبار');
  const floorNameEn = uniqueName('Test Floor');
  const floorNumber = 700 + (Date.now() % 200);
  const categoryCode = uniqueCode('RC');
  const categoryNameAr = uniqueName('فئة اختبار');
  const categoryNameEn = uniqueName('Test Category');
  const roomNumber = String(9000 + (Date.now() % 900));

  await test.step('Create branch', async () => {
    await branches.goto();
    await branches.openCreateBranch();
    await branches.createBranch({
      code: branchCode,
      nameAr: branchNameAr,
      nameEn: branchNameEn,
      country: 'Saudi Arabia',
      language: 'English',
      currency: 'Saudi Riyal',
      timezone: 'Arabia Standard Time',
    });
    await branches.goto();
    await branches.searchBranch(branchNameAr);
    await branches.expectBranchInList(branchNameAr);
  });

  await test.step('Create building', async () => {
    await buildings.goto();
    await buildings.openCreateBuilding();
    await buildings.createBuilding({
      branch: branchNameAr,
      code: buildingCode,
      nameAr: buildingNameAr,
      nameEn: buildingNameEn,
      floors: 2,
    });
    await buildings.goto();
    await buildings.searchBuilding(buildingNameAr);
    await buildings.expectBuildingInList(buildingNameAr);
  });

  await test.step('Create floor', async () => {
    await floors.goto();
    await floors.openCreateFloor();
    await floors.createFloor({
      branch: branchNameAr,
      building: buildingNameAr,
      code: floorCode,
      floorNumber,
      nameAr: floorNameAr,
      nameEn: floorNameEn,
    });
    await floors.goto();
    await floors.searchFloor(floorNameAr);
    await floors.expectFloorInList(floorNameAr);
  });

  await test.step('Create room category', async () => {
    await categories.goto();
    await categories.openCreateCategory();
    await categories.createCategory({
      branches: branchNameAr,
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

  await test.step('Create room', async () => {
    await rooms.goto();
    await rooms.openCreateRoom();
    await rooms.createRoom({
      branch: branchNameAr,
      building: buildingNameAr,
      floor: floorNameAr,
      category: categoryNameAr,
      number: roomNumber,
    });
    await rooms.goto();
    await rooms.searchRoom(roomNumber);
    await rooms.expectRoomInList(roomNumber);
  });
});
