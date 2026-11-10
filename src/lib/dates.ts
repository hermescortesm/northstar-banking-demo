/** Pure calendar math on integer day numbers (days since 1970-01-01). No Date, no clock. */

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export type DayNumber = number;
export interface CivilDate { y: number; m: number; d: number; weekday: number }

const pad2 = (n: number) => (n < 10 ? "0" : "") + n;

export function isoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function toDayNumber(iso: string): DayNumber {
  const [ys, ms, ds] = iso.split("-");
  const y0 = Number(ys), m = Number(ms), d = Number(ds);
  const y = m <= 2 ? y0 - 1 : y0;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (m + (m > 2 ? -3 : 9)) + 2) / 5) + d - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

export function fromDayNumber(n: DayNumber): CivilDate {
  const z = n + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const d = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const m = mp < 10 ? mp + 3 : mp - 9;
  const y = yoe + era * 400 + (m <= 2 ? 1 : 0);
  return { y, m, d, weekday: (((n + 4) % 7) + 7) % 7 };
}

export function toIso(n: DayNumber): string {
  const c = fromDayNumber(n);
  return isoDate(c.y, c.m, c.d);
}

export function daysInMonth(y: number, m: number): number {
  return toDayNumber(m === 12 ? isoDate(y + 1, 1, 1) : isoDate(y, m + 1, 1)) - toDayNumber(isoDate(y, m, 1));
}

/** "Nov 9" */
export function formatDayShort(n: DayNumber): string {
  const c = fromDayNumber(n);
  return `${MONTHS_SHORT[c.m - 1]} ${c.d}`;
}

/** "Nov 9, 2026" */
export function formatDayWithYear(n: DayNumber): string {
  const c = fromDayNumber(n);
  return `${MONTHS_SHORT[c.m - 1]} ${c.d}, ${c.y}`;
}

/** "Monday, November 9, 2026" */
export function formatDayLong(n: DayNumber): string {
  const c = fromDayNumber(n);
  return `${WEEKDAYS_LONG[c.weekday]}, ${MONTHS_LONG[c.m - 1]} ${c.d}, ${c.y}`;
}

/** "3:04 PM" */
export function formatClock(hour24: number, minute: number): string {
  return `${hour24 % 12 || 12}:${pad2(minute)} ${hour24 < 12 ? "AM" : "PM"}`;
}
