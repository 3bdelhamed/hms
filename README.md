# HMS Automation Showcase — Playwright + TypeScript

Professional, maintainable UI automation for a hosted Hotel Management System
(Angular SPA, Arabic RTL, "Hotel ERP"). Built step by step with Playwright
Test, strict TypeScript, Page Objects, fixtures, unique test data, and
API-assisted cleanup.

> Reservations are intentionally **not** automated (backend issues).
> The Master Data chained E2E is **blocked** by a backend lookup issue
> (see Known issues).

## Prerequisites

- Node.js 24+ (`node --version`)
- npm 11+
- Chromium via Playwright (`npx playwright install --with-deps chromium`)
- Git + VS Code (recommended)
- Access to the hosted HMS app + one valid test user

## Setup

```powershell
npm install
npx playwright install --with-deps chromium
Copy-Item .env.example .env   # then fill in real values (never commit .env)
npx tsc --noEmit
```

### Environment (.env)

| Variable        | Purpose                                    |
|-----------------|--------------------------------------------|
| `BASE_URL`      | Hosted app URL, used as Playwright baseURL |
| `TEST_USERNAME` | Login username (from login page #login-email) |
| `TEST_PASSWORD` | Login password                             |

`.env.example` holds placeholders only. `.env` is git-ignored.
`playwright.config.ts` loads `.env` first line via `dotenv/config`;
`baseURL` always comes from `process.env.BASE_URL` (never hardcoded).

## Running tests

```powershell
npm test                    # full suite
npm run test:smoke           # @smoke only
npm run test:regression      # @regression (guests, housekeeping, pricing, master-data)
npm run test:guests          # @guests
npm run test:housekeeping    # @housekeeping
npm run test:pricing         # @pricing
npm run test:master-data     # @master-data (currently backend-blocked)
npm run report               # open last HTML report
npx playwright test --list   # discover without running
```

Direct discovery also works (quote the tag in PowerShell):

```powershell
npx playwright test --grep '@smoke' --list
```

## Project structure

```
playwright.config.ts      # testDir ./tests, 30s timeout, HTML reporter,
                          # screenshot on failure, trace on first retry,
                          # retries only in CI, setup+chromium projects
tests/
  auth.setup.ts           # setup project: logs in once, saves storageState
  smoke.spec.ts           # @smoke, logged-out login page (empty storageState)
  authenticated-smoke.spec.ts  # @smoke, dashboard via saved auth
  guests/guest-crud.spec.ts            # @guests @regression
  housekeeping/housekeeping-lifecycle.spec.ts  # @housekeeping @regression
  pricing/pricing-showcase.spec.ts     # @pricing @regression
  master-data/master-data-flow.spec.ts # @master-data @regression (blocked)
pages/
  LoginPage.ts            # #login-email, #login-password, submit
  DashboardPage.ts        # dashboard heading assertion helper
  master-data/            # Branches/Buildings/Floors/RoomCategories/Rooms
  guests/GuestsPage.ts
  housekeeping/HousekeepingPage.ts
  pricing/                # Seasons/RatePlans/Packages/RatePlanSeasons
fixtures/test-fixtures.ts # loginPage, dashboardPage, apiClient, registerCleanup
utils/
  test-data.ts            # uniqueCode/Name/Email/Phone + futureDate(Input) helpers
  api-client.ts           # authenticated API client, cleanup endpoints only
playwright/.auth/         # saved login state (git-ignored, generated)
```

## Architecture notes

- **Auth once, reuse everywhere.** `auth.setup.ts` logs in with
  `TEST_USERNAME`/`TEST_PASSWORD` and writes `playwright/.auth/user.json`.
  The `chromium` project declares `dependencies: ['setup']` and loads that
  `storageState`. `smoke.spec.ts` explicitly opts out with an empty
  `storageState` to test the logged-out login page.
- **Selectors live in Page Objects; business flow lives in tests.**
  Stable hooks: element IDs (`#branch-code`, `#login-email`, …),
  `getByRole`/`getByPlaceholder`, and `ng-select[inputid="…"]` for the
  app's Angular dropdowns. Selectors are private; methods are business
  actions (`createBranch`, `completeTask`, …).
- **ng-select pattern.** Open panel → type into the search input → wait
  until exactly one match → click → verify the `.ng-value-label` applied
  value (never trust panel text) → single recovery attempt, then fail loud.
- **Dependent lookups.** Child dropdowns (buildings by branch, floors by
  building) populate via cascade API calls on parent select. Select parent
  → verify applied → wait for the specific lookup response → select child.
  Never poll an empty lookup.
- **Save synchronization.** After create/save, wait for the app's own
  signal (navigation to `/edit`, away from `/add`, or the update-request
  response) — never `waitForTimeout()`.
- **Explorer search is explicit.** Fill the search box **and** click بحث;
  results are server-filtered (filter type defaults to name).

## Test data & cleanup

- All created records use generated unique values (`BR-…`, `TST-…`,
  timestamped Arabic/English names, unique phones/emails) — isolated from
  business data, no dependency on pre-existing records.
- Tests register their own records via the `registerCleanup` fixture;
  teardown runs LIFO and reports failures without hiding test results.
- `ApiClient` (Playwright `APIRequestContext`) authenticates with the
  session bearer token + API base URL from `app-config.json` — nothing
  hardcoded. Endpoints are centralized there.
- Cleanup policy: **delete** guests (`DELETE /api/guests/{id}`) and
  housekeeping tasks (`DELETE /api/housekeeping/{id}`); **deactivate**
  pricing records (PATCH `…/deactivate/{id}`) in dependency order
  rate-plan-season → rate-plan → season → package. No bulk deletes, only
  ids captured from the current test's own creations. Old diagnostic
  records are intentionally left alone.
- Every UI/API mutation is traceable in the app's audit log (`/audit`).

## Showcase coverage

| Suite | Flow | Status |
|---|---|---|
| Smoke | Login page loads; dashboard loads authenticated | PASS |
| Guests | Create → search → edit name (gender/nationality required; edit saves via تعديل → `PUT /api/guests`) | PASS + cleaned |
| Housekeeping | Create → Pending → edit priority → complete with timestamp (confirm dialog) | PASS + cleaned |
| Pricing | Season (dynamic dates) → rate plan (min≤max stay) → package → search → sort flip → category → rate-plan-season link | PASS + cleaned |
| Master Data | Branch → building → floor → category → room chain | BLOCKED (below) |

## Known issues (verified, not automation defects)

1. **Master Data E2E blocked — backend.** `GET /api/building/lookup?branchId=<fresh>`
   fires correctly after a verified parent selection but never responds
   during test-runner execution (30–60s waits exhausted, 9 consecutive
   failures). The identical request returns ~1s in every out-of-runner
   probe (any branch, device, timing). Independent flows (branch/building
   create, category, pricing links) work. Do not retry/work around.
2. **Reservations excluded** — backend issues; do not automate.
3. **Housekeeping delete semantics** — `DELETE /api/housekeeping/{id}`
   succeeds once; re-deleting returns `400 HOUSE-BUS-003`. Deleted rows
   remain listed (soft-delete); the guest delete is a true delete
   (`GET /api/guests/{id}` → 404).
4. **Rate-plan-season dates lock** — effective-from/to disable once a
   season is selected (dates derive from the season); the POM fills them
   only when enabled. Dynamic-date coverage lives on the season form.
5. **Required fields are server/client-validated, not marked** — no HTML
   `required` attributes; e.g. branch needs country/language/currency/
   timezone, building needs floor count, guest needs gender/nationality,
   category needs branches scope + display order. Submit and read the
   `هذا الحقل مطلوب` messages.
6. **Lists render Arabic names** (RPS list renders English) — assert the
   name variant the table actually shows; prove edits via form reload
   (`toHaveValue`) where the list doesn't display a field.
7. UI language is Arabic RTL — prefer IDs/counts/roles over literal-text
   assertions; suite needs generous timeouts (backend ~1s/lookup).

## Useful references

- `AGENTS.md` — working agreements for automation sessions
- `.env.example` — required environment variables
- `utils/api-client.ts` — full cleanup endpoint list
- App audit page (`/audit`) — who changed what, including test runs
