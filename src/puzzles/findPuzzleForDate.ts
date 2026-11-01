import type { Schedule } from "./extendSchedule";
import { getPuzzleNumber, type CalendarDate } from "./getPuzzleNumber";

/**
 * The words a date's puzzle is played with. The stored shortest path moves
 * are left out, so they can't be used as par by accident: the app works par
 * out itself (D24).
 */
export interface PuzzleForDate {
  start: string;
  target: string;
}

export type FindPuzzleForDateResult =
  | { ok: true; puzzleNumber: number; puzzle: PuzzleForDate }
  | { ok: false; reason: "invalid-date" | "before-launch" | "after-schedule" };

/**
 * The puzzle everyone plays on this date: line N of the schedule is puzzle
 * #N (D15, D24). A date past the last line has no puzzle.
 */
export function findPuzzleForDate(
  date: CalendarDate,
  launchDate: CalendarDate,
  schedule: Schedule,
): FindPuzzleForDateResult {
  const puzzleNumberResult = getPuzzleNumber(date, launchDate);
  if (!puzzleNumberResult.ok) {
    return puzzleNumberResult;
  }
  const { puzzleNumber } = puzzleNumberResult;
  const scheduledPuzzle = schedule[puzzleNumber - 1];
  if (scheduledPuzzle === undefined) {
    return { ok: false, reason: "after-schedule" };
  }
  const { start, target } = scheduledPuzzle;
  return { ok: true, puzzleNumber, puzzle: { start, target } };
}
