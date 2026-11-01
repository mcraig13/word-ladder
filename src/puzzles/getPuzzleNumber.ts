/**
 * A date on the calendar, with no time or timezone. Month is 1–12. The app
 * builds it from the player's local date (D6).
 */
export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export type GetPuzzleNumberResult =
  { ok: true; puzzleNumber: number } | { ok: false; reason: "invalid-date" | "before-launch" };

/** 24 hours × 60 minutes × 60 seconds × 1000 milliseconds. */
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Days since 1 January 1970, or undefined if the date isn't on the calendar
 * (29 February in a year that isn't a leap year, month 13, a fraction).
 * Date.UTC drops fractions and rolls over out-of-range parts, so building the
 * date back and comparing catches all of these.
 * UTC has no clock changes, so every day is the same length, and the clock is
 * never read. Date.UTC treats years 0–99 as 1900–1999, so those are invalid.
 */
function getDayCount(date: CalendarDate): number | undefined {
  const { year, month, day } = date;
  const milliseconds = Date.UTC(year, month - 1, day);
  const builtDate = new Date(milliseconds);
  const isSameDate =
    builtDate.getUTCFullYear() === year &&
    builtDate.getUTCMonth() === month - 1 &&
    builtDate.getUTCDate() === day;
  return isSameDate ? milliseconds / MILLISECONDS_PER_DAY : undefined;
}

/**
 * The puzzle number people share: the launch date is #1, and the number goes
 * up by one each day (D15). Both dates are checked before the launch is, so
 * an invalid date is never reported as before launch.
 */
export function getPuzzleNumber(
  date: CalendarDate,
  launchDate: CalendarDate,
): GetPuzzleNumberResult {
  const dayCount = getDayCount(date);
  const launchDayCount = getDayCount(launchDate);
  if (dayCount === undefined || launchDayCount === undefined) {
    return { ok: false, reason: "invalid-date" };
  }
  const daysSinceLaunch = dayCount - launchDayCount;
  if (daysSinceLaunch < 0) {
    return { ok: false, reason: "before-launch" };
  }
  return { ok: true, puzzleNumber: daysSinceLaunch + 1 };
}
