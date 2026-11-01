import { createScheduleFromText } from "./createScheduleFromText";
import { extendSchedule, type ExtendScheduleOptions } from "./extendSchedule";
import { getScheduleText } from "./getScheduleText";

export interface GetExtendedScheduleTextOptions extends Omit<
  ExtendScheduleOptions,
  "lastPuzzleNumber"
> {
  /** Before launch, today is #0 (2.6b intent). */
  todaysPuzzleNumber: number;
  /** How many puzzles after today's the schedule reaches, about a year (D24). */
  puzzlesAhead: number;
}

export type GetExtendedScheduleTextResult =
  | { ok: true; scheduleText: string }
  | { ok: false; reason: "unreadable-line"; lineNumber: number }
  | { ok: false; reason: "no-puzzle-in-range"; puzzleNumber: number };

/**
 * The schedule file's text with puzzles added after its last line, up to the
 * puzzles ahead of today's (chunk 2.6b). extendSchedule never changes or
 * removes a puzzle, and getScheduleText writes back exactly the lines the
 * reader accepts, so the file's existing text stays as it is (D24).
 */
export function getExtendedScheduleText(
  scheduleText: string,
  options: GetExtendedScheduleTextOptions,
): GetExtendedScheduleTextResult {
  const { todaysPuzzleNumber, puzzlesAhead, ...extendOptions } = options;
  const readResult = createScheduleFromText(scheduleText);
  if (!readResult.ok) {
    return readResult;
  }

  const extendResult = extendSchedule(readResult.schedule, {
    ...extendOptions,
    lastPuzzleNumber: todaysPuzzleNumber + puzzlesAhead,
  });
  if (!extendResult.ok) {
    return extendResult;
  }

  return { ok: true, scheduleText: getScheduleText(extendResult.schedule) };
}
