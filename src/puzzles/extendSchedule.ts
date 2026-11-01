import { createDictionaryFromWords, type Dictionary } from "../core/createDictionaryFromWords";
import { findShortestPath } from "../core/findShortestPath";
import { generatePuzzle } from "./generatePuzzle";

/** One line of the schedule file: line N is puzzle #N (chunk 2.6a). */
export interface ScheduledPuzzle {
  start: string;
  target: string;
  /**
   * Moves in a shortest path over the accepted words when it was scheduled.
   * The app works par out itself (D24); this is the baseline 2.6b's check
   * compares with when a word list changes.
   */
  shortestPathMoves: number;
}

/** The first puzzle is puzzle #1. */
export type Schedule = readonly ScheduledPuzzle[];

export interface ExtendScheduleOptions {
  acceptedWords: Dictionary;
  puzzleWords: Dictionary;
  wordLength: number;
  /** The range for the shortest path, in moves, not par (D16, D27). */
  shortestPathMoves: { fewest: number; most: number };
  /** Puzzle #N is generated from this plus N, so it depends only on N. */
  scheduleSeed: number;
  /** How many puzzles after one a start or target can't be either (D30). */
  daysBeforeWordRepeats: number;
  lastPuzzleNumber: number;
}

export type ExtendScheduleResult =
  | { ok: true; schedule: Schedule }
  | { ok: false; reason: "no-puzzle-in-range"; puzzleNumber: number };

/**
 * The schedule with a puzzle added for each number after its last, up to the
 * last puzzle number (chunk 2.6a). Puzzles already in it are never changed or
 * removed, so published dates stay the same (D24).
 */
export function extendSchedule(
  schedule: Schedule,
  options: ExtendScheduleOptions,
): ExtendScheduleResult {
  const { acceptedWords, puzzleWords, wordLength, shortestPathMoves } = options;
  const { scheduleSeed, daysBeforeWordRepeats, lastPuzzleNumber } = options;
  const extendedSchedule = [...schedule];
  const allPuzzleWords = puzzleWords.getWordsOfLength(wordLength);

  for (let puzzleNumber = schedule.length + 1; puzzleNumber <= lastPuzzleNumber; puzzleNumber++) {
    // slice(-0) would be the whole schedule, so a window of 0 holds back nothing.
    const recentPuzzles =
      daysBeforeWordRepeats > 0 ? extendedSchedule.slice(-daysBeforeWordRepeats) : [];
    const recentWords = new Set(recentPuzzles.flatMap((puzzle) => [puzzle.start, puzzle.target]));
    const generated = generatePuzzle({
      acceptedWords,
      puzzleWords: createDictionaryFromWords(
        allPuzzleWords.filter((word) => !recentWords.has(word)),
      ),
      wordLength,
      shortestPathMoves,
      seed: (scheduleSeed + puzzleNumber) >>> 0,
    });
    // A separate search from the one that picked the puzzle, so the stored
    // moves are a cross-check rather than a copy (2.6a plan). Every generated
    // puzzle has a path over the accepted words, so only generation fails.
    const shortestPathOrFailure = generated.ok
      ? findShortestPath(generated.puzzle.start, generated.puzzle.target, acceptedWords)
      : generated;
    if (!generated.ok || !shortestPathOrFailure.ok) {
      return { ok: false, reason: "no-puzzle-in-range", puzzleNumber };
    }
    const { start, target } = generated.puzzle;
    extendedSchedule.push({
      start,
      target,
      shortestPathMoves: shortestPathOrFailure.path.length - 1,
    });
  }

  return { ok: true, schedule: extendedSchedule };
}
