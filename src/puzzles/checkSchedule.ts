import type { Dictionary } from "../core/createDictionaryFromWords";
import { findShortestPath } from "../core/findShortestPath";
import type { Schedule, ScheduledPuzzle } from "./extendSchedule";

export interface CheckScheduleOptions {
  acceptedWords: Dictionary;
  puzzleWords: Dictionary;
  /** The moves a shortest path may have after today's, 4-6 in the build (D16). */
  shortestPathMoves: { fewest: number; most: number };
  /** How many puzzles after one a start or target can't be either; 0 is off (D30). */
  daysBeforeWordRepeats: number;
  /** Before launch, today is #0 (2.6b intent). */
  todaysPuzzleNumber: number;
  /** The fewest puzzles the schedule must have after today's, 60 in the build (D24). */
  fewestPuzzlesAhead: number;
}

type PuzzleFailureReason =
  | "same-start-and-target"
  | "not-a-puzzle-word"
  | "word-repeats-too-soon"
  | "unsolvable"
  | "shortest-path-changed"
  | "shortest-path-out-of-range";

export type CheckScheduleResult =
  | { ok: true }
  | { ok: false; reason: PuzzleFailureReason; puzzleNumber: number }
  | { ok: false; reason: "too-few-puzzles-ahead"; puzzlesAhead: number };

/**
 * The first puzzle in the schedule that breaks a rule, or too few puzzles
 * after today's (chunk 2.6c). Every date is checked, not only published ones,
 * so a word-list change shows when it's made (2.6c intent, least sure 1).
 * Only the range check skips published puzzles: their dates never change, so
 * a later change to the range mustn't fail them (chunk 2.3, D24).
 */
export function checkSchedule(
  schedule: Schedule,
  options: CheckScheduleOptions,
): CheckScheduleResult {
  for (const [index, puzzle] of schedule.entries()) {
    // The puzzles before this one inside the window; a window of 0 is none.
    const recentPuzzles = schedule.slice(Math.max(0, index - options.daysBeforeWordRepeats), index);
    const isPublished = index + 1 <= options.todaysPuzzleNumber;
    const reason = findPuzzleFailure(puzzle, recentPuzzles, isPublished, options);
    if (reason !== undefined) {
      return { ok: false, reason, puzzleNumber: index + 1 };
    }
  }

  const puzzlesAhead = schedule.length - options.todaysPuzzleNumber;
  // Written so NaN fails: every comparison with NaN is false (2.6b review G4).
  if (!(puzzlesAhead >= options.fewestPuzzlesAhead)) {
    return { ok: false, reason: "too-few-puzzles-ahead", puzzlesAhead };
  }
  return { ok: true };
}

/**
 * Why one puzzle fails, or undefined if it passes. The same word as start and
 * target is checked first, since its shortest path would only report it as
 * changed (2.6c plan). The range is checked after the stored moves are shown
 * to be true, so a wrong number is reported as changed (2.3 plan).
 */
function findPuzzleFailure(
  puzzle: ScheduledPuzzle,
  recentPuzzles: Schedule,
  isPublished: boolean,
  options: CheckScheduleOptions,
): PuzzleFailureReason | undefined {
  const { start, target, shortestPathMoves } = puzzle;
  if (start === target) {
    return "same-start-and-target";
  }
  if (!options.puzzleWords.containsWord(start) || !options.puzzleWords.containsWord(target)) {
    return "not-a-puzzle-word";
  }
  const recentWords = new Set(recentPuzzles.flatMap((recent) => [recent.start, recent.target]));
  if (recentWords.has(start) || recentWords.has(target)) {
    return "word-repeats-too-soon";
  }
  const shortestPath = findShortestPath(start, target, options.acceptedWords);
  if (!shortestPath.ok) {
    return "unsolvable";
  }
  if (shortestPath.path.length - 1 !== shortestPathMoves) {
    return "shortest-path-changed";
  }
  const { fewest, most } = options.shortestPathMoves;
  // Written so a NaN end fails, as the puzzles-ahead check is (2.6b review G4).
  if (!isPublished && !(shortestPathMoves >= fewest && shortestPathMoves <= most)) {
    return "shortest-path-out-of-range";
  }
  return undefined;
}
