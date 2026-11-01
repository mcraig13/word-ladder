import type { Dictionary } from "../core/createDictionaryFromWords";
import { findShortestPath } from "../core/findShortestPath";
import type { Schedule, ScheduledPuzzle } from "./extendSchedule";

export interface CheckScheduleOptions {
  acceptedWords: Dictionary;
  puzzleWords: Dictionary;
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
  | "shortest-path-changed";

export type CheckScheduleResult =
  | { ok: true }
  | { ok: false; reason: PuzzleFailureReason; puzzleNumber: number }
  | { ok: false; reason: "too-few-puzzles-ahead"; puzzlesAhead: number };

/**
 * The first puzzle in the schedule that breaks a rule, or too few puzzles
 * after today's (chunk 2.6c). Every date is checked, not only published ones,
 * so a word-list change shows when it's made (2.6c intent, least sure 1).
 */
export function checkSchedule(
  schedule: Schedule,
  options: CheckScheduleOptions,
): CheckScheduleResult {
  for (const [index, puzzle] of schedule.entries()) {
    // The puzzles before this one inside the window; a window of 0 is none.
    const recentPuzzles = schedule.slice(Math.max(0, index - options.daysBeforeWordRepeats), index);
    const reason = findPuzzleFailure(puzzle, recentPuzzles, options);
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
 * changed (2.6c plan).
 */
function findPuzzleFailure(
  puzzle: ScheduledPuzzle,
  recentPuzzles: Schedule,
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
  return undefined;
}
