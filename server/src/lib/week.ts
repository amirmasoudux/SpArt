// Prospekt offers run Monday to Saturday. The demo data stores weekdays ("MON", "SAT"),
// and this turns them into real dates of the current week.
const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function weekdayToDate(weekday: string, today = new Date()): Date {
  const todayIndex = (today.getDay() + 6) % 7; // Monday = 0
  const date = new Date(today);
  date.setHours(0, 0, 0, 0);
  date.setDate(today.getDate() - todayIndex + WEEKDAYS.indexOf(weekday));
  return date;
}

export function endOfDay(d: Date): Date {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
}
