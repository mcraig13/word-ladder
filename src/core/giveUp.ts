import type { Game } from "./createGame";

export type GiveUpResult = { ok: true; game: Game } | { ok: false; reason: "game-over" };

/**
 * The game ended as a loss, or the reason it can't be given up (chunk 1.8).
 * The chain is kept as played. The game passed in is left as it was: callers
 * replace their current game with the one returned. A game that has already
 * ended, won or given up, can't be given up.
 */
export function giveUp(game: Game): GiveUpResult {
  if (game.status !== "in-progress") {
    return { ok: false, reason: "game-over" };
  }

  return {
    ok: true,
    game: { ...game, status: "given-up" },
  };
}
