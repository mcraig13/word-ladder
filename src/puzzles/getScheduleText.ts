import type { Schedule } from "./extendSchedule";

/**
 * The schedule file's text: line N is puzzle #N as `start target moves`, one
 * space apart, LF, a newline after each line, like the word lists (2.6a).
 */
export function getScheduleText(schedule: Schedule): string {
  return schedule
    .map((puzzle) => `${puzzle.start} ${puzzle.target} ${String(puzzle.shortestPathMoves)}\n`)
    .join("");
}
