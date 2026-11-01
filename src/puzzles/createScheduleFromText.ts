import type { Schedule, ScheduledPuzzle } from "./extendSchedule";

export type CreateScheduleFromTextResult =
  { ok: true; schedule: Schedule } | { ok: false; reason: "unreadable-line"; lineNumber: number };

/**
 * `start target moves`: lowercase words, one space apart, moves a whole
 * number above zero. Anchored at both ends, so a capital, a blank line, a
 * `\r` or a part missing or extra doesn't match (2.6b plan).
 */
const SCHEDULE_LINE = /^([a-z]+) ([a-z]+) ([1-9][0-9]*)$/;

/**
 * The schedule in the file's text, as getScheduleText writes it: line N is
 * puzzle #N, with a newline after each line (chunk 2.6b). The first line that
 * doesn't match is returned with its number, counting from 1, rather than
 * guessed at, so a line read back is written back exactly as it was (D24).
 */
export function createScheduleFromText(text: string): CreateScheduleFromTextResult {
  // The newline after the last line leaves an empty piece at the end; any
  // other piece is a line. A last line with no newline is then the last piece.
  const pieces = text.split("\n");
  const lastPiece = pieces.pop();
  if (lastPiece !== "") {
    return { ok: false, reason: "unreadable-line", lineNumber: pieces.length + 1 };
  }

  const schedule: ScheduledPuzzle[] = [];
  for (const [index, line] of pieces.entries()) {
    const match = SCHEDULE_LINE.exec(line);
    if (match === null) {
      return { ok: false, reason: "unreadable-line", lineNumber: index + 1 };
    }
    const [, start = "", target = "", moves = ""] = match;
    schedule.push({ start, target, shortestPathMoves: Number(moves) });
  }

  return { ok: true, schedule };
}
