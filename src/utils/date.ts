import { format, parseISO, addDays as fnsAddDays, subDays as fnsSubDays, isValid } from 'date-fns';

/**
 * Normalizes a Date object to a YYYY-MM-DD string using local calendar time (avoids UTC offset day shifts).
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayKey(): string {
  return formatDateKey(new Date());
}

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 */
export function parseDateKey(dateKey: string): Date {
  const parts = dateKey.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  const parsed = parseISO(dateKey);
  return isValid(parsed) ? parsed : new Date();
}

/**
 * Formats a date key for display, e.g. "Tuesday, 06 October 2026".
 */
export function formatDisplayDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return format(date, 'EEEE, dd MMMM yyyy');
}

/**
 * Formats a date key into compact format, e.g. "06-Oct-2026".
 */
export function formatCompactDate(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return format(date, 'dd-MMM-yyyy');
}

/**
 * Returns the weekday name (e.g. "Tuesday").
 */
export function getWeekdayName(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return format(date, 'EEEE');
}

/**
 * Adds or subtracts days from a date key string.
 */
export function offsetDateKey(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey);
  const target = days >= 0 ? fnsAddDays(date, days) : fnsSubDays(date, Math.abs(days));
  return formatDateKey(target);
}

/**
 * Checks if a routine should run on a specific day of the week.
 * repeatDays: array of day numbers (0 = Sun, 1 = Mon, ... 6 = Sat).
 */
export function isRoutineScheduledForDate(repeatDays: number[], dateKey: string): boolean {
  if (!repeatDays || repeatDays.length === 0) return true;
  const date = parseDateKey(dateKey);
  const dayOfWeek = date.getDay();
  return repeatDays.includes(dayOfWeek);
}
