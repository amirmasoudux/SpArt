// Date helper for offer weeks: an offer is valid until the end of its last day.
export function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
