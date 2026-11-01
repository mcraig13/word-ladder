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
  /** Puzzle #N's seed is a hash of this and N, so it depends only on N. */
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
      seed: getPuzzleSeed(scheduleSeed, puzzleNumber),
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

// The two multipliers of MurmurHash3's 32-bit finaliser (fmix32), chosen by
// its author so that every input bit affects every output bit. Changing them
// would reshuffle every date (D24).
const FIRST_MIXING_MULTIPLIER = 0x85ebca6b;
const SECOND_MIXING_MULTIPLIER = 0xc2b2ae35;

/**
 * MurmurHash3's finaliser, with its shifts of 16, 13 and 16 bits. Each step
 * (an xor with a right shift, or a multiply by an odd number) can be undone,
 * so different inputs give different outputs.
 */
function mixBits(value: number): number {
  let mixed = value >>> 0;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, FIRST_MIXING_MULTIPLIER);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, SECOND_MIXING_MULTIPLIER);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
}

/**
 * A whole number from 0 to 2³² − 1 for puzzle #N (2.6a, review A3). Mixing
 * the schedule seed first means a seed one higher gives unrelated puzzles,
 * not the same ones a day later; mixing again keeps nearby puzzle numbers'
 * seeds unrelated. Both mixes can be undone, so within one schedule every
 * puzzle number gets a different seed.
 */
function getPuzzleSeed(scheduleSeed: number, puzzleNumber: number): number {
  return mixBits(mixBits(scheduleSeed) ^ puzzleNumber);
}
