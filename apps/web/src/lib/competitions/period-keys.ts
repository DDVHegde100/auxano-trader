/** ISO week key e.g. 2026-W23 */
export function getWeekSeasonKey(date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function getMonthSeasonKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-M${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getWeekBounds(date = new Date()): { startsAt: Date; endsAt: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const startsAt = new Date(d);
  startsAt.setDate(d.getDate() + diffToMon);
  startsAt.setHours(0, 0, 0, 0);
  const endsAt = new Date(startsAt);
  endsAt.setDate(startsAt.getDate() + 7);
  endsAt.setMilliseconds(-1);
  return { startsAt, endsAt };
}

export function getMonthBounds(date = new Date()): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(date.getFullYear(), date.getMonth(), 1);
  const endsAt = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { startsAt, endsAt };
}

export function weekIndex(date = new Date()): number {
  const key = getWeekSeasonKey(date);
  const n = parseInt(key.split("-W")[1] ?? "1", 10);
  return Number.isFinite(n) ? n : 1;
}

export function monthIndex(date = new Date()): number {
  return date.getUTCMonth() + date.getUTCFullYear() * 12;
}
