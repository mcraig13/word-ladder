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
  readonly chain: Chain;
  readonly status: "in-progress" | "won" | "given-up";
  /** Undos used so far; each adds one to the score (D26, chunk 1.13). */
  readonly undoCount: number;
}

export type CreateGameResult =
  | { ok: true; game: Game }
  | { ok: false; reason: "invalid-word" | "different-lengths" | "same-word" };

/**
 * A new game from start to target, with words stored lowercase. Whether the
 * words are in the dictionary is left to puzzle generation, which picks them.
 */
export function createGame(start: string, target: string): CreateGameResult {
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

  return {
    ok: true,
    game: {
      start: normalisedStart.word,
      target: normalisedTarget.word,
      chain: [normalisedStart.word],
      status: "in-progress",
      undoCount: 0,
    },
  };
}
