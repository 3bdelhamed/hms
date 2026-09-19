// Unique, human-readable test data. Suffix format: MMDD-HHMMSS-RRR
// (date-time plus random), so values are sortable and traceable in output.

function suffix(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, '0');
  const stamp = `${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = pad(Math.floor(Math.random() * 1000), 3);
  return `${stamp}-${rand}`;
}

/** e.g. TST-0919-153045-042 — uppercase alphanumeric, safe for code fields. */
export function uniqueCode(prefix = 'TST'): string {
  return `${prefix}-${suffix()}`.toUpperCase();
}

/** e.g. Test 0919-153045-042 — safe for name fields. */
export function uniqueName(base = 'Test'): string {
  return `${base} ${suffix()}`;
}

/** e.g. tst.0919153045.042@example.com — valid email shape. */
export function uniqueEmail(prefix = 'tst'): string {
  return `${prefix}.${suffix().replace(/-/g, '')}@example.com`.toLowerCase();
}

/** e.g. 5591198765432 — digits only, mobile-like (prefix + time-derived tail). */
export function uniquePhone(prefix = '55'): string {
  const tail = `${String(Date.now()).slice(-6)}${Math.floor(Math.random() * 100)}`;
  return `${prefix}${tail}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Dynamic future date for `<input type="date">`, e.g. 2026-10-19. */
export function futureDateInput(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Dynamic future datetime for `<input type="datetime-local">`, e.g. 2026-10-19T14:00. */
export function futureDateTimeInput(daysAhead: number, hour: number, minute: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
