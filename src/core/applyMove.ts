import { checkMove, type CheckMoveResult } from "./checkMove";
import type { Dictionary } from "./createDictionaryFromWords";
import type { Game } from "./createGame";

export type ApplyMoveResult =
  | { ok: true; game: Game }
  | { ok: false; reason: "game-over" | Extract<CheckMoveResult, { ok: false }>["reason"] };

/**
 * The game after playing the next word, or the reason it can't be played
 * (chunk 1.6). The game passed in is left as it was: callers replace their
 * current game with the one returned. Reaching the target wins the game, and
 * no moves are accepted after that.
 */
export function applyMove(game: Game, nextWord: string, dictionary: Dictionary): ApplyMoveResult {
  if (game.status !== "in-progress") {
    return { ok: false, reason: "game-over" };
  }

  const move = checkMove(game.chain, nextWord, dictionary);
  if (!move.ok) {
    return move;
  }

  return {
    ok: true,
    game: {
      ...game,
      chain: [...game.chain, move.word],
      status: move.word === game.target ? "won" : "in-progress",
    },
  };
}
