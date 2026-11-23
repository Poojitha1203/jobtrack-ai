// Small date helpers built on the native Date and Intl APIs (no date library needed yet).

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Monday 00:00 of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const day = startOfDay(date);
  const offset = (day.getDay() + 6) % 7; // getDay(): Sunday = 0 → shift so Monday = 0
  day.setDate(day.getDate() - offset);
  return day;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Whole calendar days from today until `date` (negative = in the past). */
export function daysFromToday(date: Date, today: Date = new Date()): number {
  return Math.round((startOfDay(date).getTime() - startOfDay(today).getTime()) / DAY_MS);
}

const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const longDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

export const formatShortDate = (date: Date) => shortDate.format(date); // "Nov 23"
export const formatLongDate = (date: Date) => longDate.format(date); // "Monday, November 23"
export const formatTime = (date: Date) => time.format(date); // "2:30 PM"

/** "Today", "Tomorrow", "In 3 days", "Yesterday", ... */
export function formatRelativeDay(date: Date, today: Date = new Date()): string {
  const text = relative.format(daysFromToday(date, today), 'day');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Greeting that matches the user's local time of day. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
