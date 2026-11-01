import type { CalendarDate } from "../puzzles/getPuzzleNumber";

/**
 * The player's local date at this moment: "today" is local, not UTC (D6).
 * `getMonth` counts January as 0, and `CalendarDate` counts it as 1.
 */
export function getLocalCalendarDate(now: Date): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}
