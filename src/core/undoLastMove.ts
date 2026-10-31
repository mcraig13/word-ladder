import type { Game } from "./createGame";

export type UndoLastMoveResult =
  | { ok: true; game: Game }
  | { ok: false; reason: "game-over" | "nothing-to-undo" };

/**
 * The game without its last word, or the reason it can't be undone
 * (chunk 1.7). Undo is free and cannot go past the start word. The game passed
 * in is left as it was: callers replace their current game with the one
 * returned. No undo once the game has ended.
 */
export function undoLastMove(game: Game): UndoLastMoveResult {
  if (game.status !== "in-progress") {
    return { ok: false, reason: "game-over" };
  }

  if (game.chain.length <= 1) {
    return { ok: false, reason: "nothing-to-undo" };
  }

  return {
    ok: true,
    game: { ...game, chain: game.chain.slice(0, -1) },
  };
}
