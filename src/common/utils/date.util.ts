/** Today's calendar date (server local time) as a UTC midnight Date. */
export function todayDateOnly(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** Parses `YYYY-MM-DD` into a UTC midnight Date (for `@db.Date` columns). */
export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    throw new RangeError(`Fecha invalida: "${value}"`);
  }
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}
