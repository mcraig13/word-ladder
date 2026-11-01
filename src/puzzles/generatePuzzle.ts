import type { Dictionary } from "../core/createDictionaryFromWords";
import { getWordsOneLetterAway } from "../core/getWordsOneLetterAway";
import { createSeededRandom } from "./createSeededRandom";

export interface GeneratePuzzleOptions {
  /** The words moves are checked against; the shortest path is over these. */
  acceptedWords: Dictionary;
  /** The words a start or target can be (D8). */
  puzzleWords: Dictionary;
  wordLength: number;
  /** The range for the shortest path, in moves, not par (D16, D27). */
  shortestPathMoves: { fewest: number; most: number };
  /** A whole number from 0 to 2³² − 1; see createSeededRandom. */
  seed: number;
}

/** Only start and target: createGame works out par itself (1.10). */
export interface Puzzle {
  start: string;
  target: string;
}

export type GeneratePuzzleResult =
  { ok: true; puzzle: Puzzle } | { ok: false; reason: "no-puzzle-in-range" };

/**
 * A start and target from the puzzle words whose shortest path over the
 * accepted words is inside the range, the same for the same seed (chunk 2.2).
 * Run at build time to write the schedule, not in the browser (D24).
 *
 * One breadth-first search from the start gives the moves to every word in
 * range, rather than a shortest-path search per target. A start with no
 * target in range is dropped and another picked, until none are left.
 */
export function generatePuzzle(options: GeneratePuzzleOptions): GeneratePuzzleResult {
  const { acceptedWords, puzzleWords, wordLength, shortestPathMoves, seed } = options;
  const random = createSeededRandom(seed);

  // Each word's neighbours are found once per call, so a retried start's
  // search doesn't scan the dictionary again for words it shares.
  const neighboursByWord = new Map<string, readonly string[]>();
  function getNeighbours(word: string): readonly string[] {
    let neighbours = neighboursByWord.get(word);
    if (neighbours === undefined) {
      neighbours = getWordsOneLetterAway(word, acceptedWords);
      neighboursByWord.set(word, neighbours);
    }
    return neighbours;
  }

  // Alphabetical, from the dictionary, so the same seed picks the same words.
  const candidates = puzzleWords
    .getWordsOfLength(wordLength)
    .filter((word) => acceptedWords.containsWord(word));
  let remainingStarts = candidates;
  let start = random.pickFrom(remainingStarts);

  while (start !== undefined) {
    const movesFromStart = getMovesFromStart(start, shortestPathMoves.most, getNeighbours);
    // A word the search didn't reach has no moves, so it's never a target.
    const targets = candidates.filter((word) => {
      const moves = movesFromStart.get(word);
      return (
        word !== start &&
        moves !== undefined &&
        moves >= shortestPathMoves.fewest &&
        moves <= shortestPathMoves.most
      );
    });
    const target = random.pickFrom(targets);
    if (target !== undefined) {
      return { ok: true, puzzle: { start, target } };
    }

    const droppedStart = start;
    remainingStarts = remainingStarts.filter((word) => word !== droppedStart);
    start = random.pickFrom(remainingStarts);
  }

  return { ok: false, reason: "no-puzzle-in-range" };
}

/**
 * The moves from start to each word reached within the most moves, by
 * breadth-first search. The first time a word is reached is its fewest moves.
 */
function getMovesFromStart(
  start: string,
  most: number,
  getNeighbours: (word: string) => readonly string[],
): Map<string, number> {
  const movesByWord = new Map([[start, 0]]);
  const wordsToExplore = [{ word: start, moves: 0 }];

  for (const { word, moves } of wordsToExplore) {
    if (moves >= most) {
      continue;
    }

    for (const nextWord of getNeighbours(word)) {
      if (!movesByWord.has(nextWord)) {
        movesByWord.set(nextWord, moves + 1);
        wordsToExplore.push({ word: nextWord, moves: moves + 1 });
      }
    }
  }

  return movesByWord;
}
