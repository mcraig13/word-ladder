import type { Dictionary } from "./createDictionaryFromWords";
import { findShortestPath } from "./findShortestPath";
import { getPar } from "./getPar";
import { normaliseWord } from "./normaliseWord";

/**
 * The words played so far: the start word, then each word after it
 * (chunk 1.12). The type rules out an empty chain.
 */
export type Chain = readonly [startWord: string, ...laterWords: string[]];

/**
 * One game as plain data (chunk 1.6). The chain always begins with the start
 * word. Games are never changed in place: moves return a new game.
 */
export interface Game {
  readonly start: string;
  readonly target: string;
  /** Typical moves for this puzzle, from a shortest path (D27); shown from the start (D9). */
  readonly par: number;
  readonly chain: Chain;
  readonly status: "in-progress" | "won" | "given-up";
  /** Undos used so far; each adds one to the score (D26, chunk 1.13). */
  readonly undoCount: number;
}

export type CreateGameResult =
  | { ok: true; game: Game }
  | {
      ok: false;
      reason: "invalid-word" | "different-lengths" | "same-word" | "not-a-word" | "unreachable";
    };

/**
 * A new game from start to target, with words stored lowercase. Start and
 * target must be accepted words with a path between them (D8). Par is worked
 * out here from a shortest path (D27, chunk 1.10), so it can't disagree with
 * the words. The search runs last: it's the slow step, and a start equal to
 * the target would otherwise find a path of no moves.
 */
export function createGame(
  start: string,
  target: string,
  dictionary: Dictionary,
): CreateGameResult {
  const normalisedStart = normaliseWord(start);
  const normalisedTarget = normaliseWord(target);

  if (!normalisedStart.ok || !normalisedTarget.ok) {
    return { ok: false, reason: "invalid-word" };
  }

  if (normalisedStart.word.length !== normalisedTarget.word.length) {
    return { ok: false, reason: "different-lengths" };
  }

  if (normalisedStart.word === normalisedTarget.word) {
    return { ok: false, reason: "same-word" };
  }

  const shortestPath = findShortestPath(normalisedStart.word, normalisedTarget.word, dictionary);
  if (!shortestPath.ok) {
    return { ok: false, reason: shortestPath.reason };
  }

  return {
    ok: true,
    game: {
      start: normalisedStart.word,
      target: normalisedTarget.word,
      par: getPar(shortestPath.path.length - 1),
      chain: [normalisedStart.word],
      status: "in-progress",
      undoCount: 0,
    },
  };
}
