import { request, type APIRequestContext, type Page } from '@playwright/test';

// Centralized API endpoint shapes (paths observed in the app's OpenAPI surface).
// All methods target a single record by id — bulk operations are not supported here.
const ENDPOINTS = {
  guest: (id: string) => `/api/guests/${id}`,
  housekeepingTask: (id: string) => `/api/housekeeping/${id}`,
  ratePlanSeason: (id: string) => `/api/rate-plan-season/${id}`,
  ratePlan: (id: string) => `/api/rate-plan/${id}`,
  season: (id: string) => `/api/season/${id}`,
  pkg: (id: string) => `/api/package/${id}`,
  deactivateRatePlanSeason: (id: string) => `/api/rate-plan-season/deactivate/${id}`,
  deactivateRatePlan: (id: string) => `/api/rate-plan/deactivate/${id}`,
  deactivateSeason: (id: string) => `/api/season/deactivate/${id}`,
  deactivatePackage: (id: string) => `/api/package/deactivate/${id}`,
} as const;

async function readAccessToken(page: Page): Promise<string> {
  return page.evaluate((): string => {
    try {
      const raw = localStorage.getItem('hotel-pms-auth-session') ?? '';
      return (JSON.parse(raw) as { accessToken?: string }).accessToken ?? '';
    } catch {
      return '';
    }
  });
}

export class ApiClient {
  private constructor(private readonly context: APIRequestContext) {}

  // Builds an authenticated client from the test's logged-in page:
  // bearer token comes from the app session, API base URL from app-config.json.
  // Nothing is hardcoded; no credentials are stored.
  static async fromPage(page: Page): Promise<ApiClient> {
    let token = await readAccessToken(page);
    if (!token) {
      // Fixture setup can run before the test navigates anywhere; land on the
      // app once so the session is available, then read again (single attempt).
      await page.goto('/');
      token = await readAccessToken(page);
    }
    if (!token) throw new Error('API client: no access token in hotel-pms-auth-session');
    const config = await page.evaluate(async (): Promise<{ baseUrl?: string }> => {
      const res = await fetch('/app-config.json');
      return (await res.json()) as { baseUrl?: string };
    });
    if (!config.baseUrl) throw new Error('API client: no baseUrl in app-config.json');
    const context = await request.newContext({
      baseURL: config.baseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    return new ApiClient(context);
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }

  private async send(method: 'delete' | 'patch', path: string, action: string): Promise<void> {
    const res = await this.context.fetch(path, { method });
    if (!res.ok) throw new Error(`API cleanup ${action} failed: ${method.toUpperCase()} ${path} -> ${res.status()}`);
  }

  deleteGuest(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.guest(id), `delete guest ${id}`);
  }

  deleteHousekeepingTask(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.housekeepingTask(id), `delete housekeeping task ${id}`);
  }

  deactivateRatePlanSeason(id: string): Promise<void> {
    return this.send('patch', ENDPOINTS.deactivateRatePlanSeason(id), `deactivate rate plan season ${id}`);
  }

  deactivateRatePlan(id: string): Promise<void> {
    return this.send('patch', ENDPOINTS.deactivateRatePlan(id), `deactivate rate plan ${id}`);
  }

  deactivateSeason(id: string): Promise<void> {
    return this.send('patch', ENDPOINTS.deactivateSeason(id), `deactivate season ${id}`);
  }

  deactivatePackage(id: string): Promise<void> {
    return this.send('patch', ENDPOINTS.deactivatePackage(id), `deactivate package ${id}`);
  }

  deleteRatePlanSeason(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.ratePlanSeason(id), `delete rate plan season ${id}`);
  }

  deleteRatePlan(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.ratePlan(id), `delete rate plan ${id}`);
  }

  deleteSeason(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.season(id), `delete season ${id}`);
  }

  deletePackage(id: string): Promise<void> {
    return this.send('delete', ENDPOINTS.pkg(id), `delete package ${id}`);
  }
}
