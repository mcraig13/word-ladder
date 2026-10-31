import type { Game } from "./createGame";

export type UndoLastMoveResult =
  { ok: true; game: Game } | { ok: false; reason: "game-over" | "nothing-to-undo" };

/**
 * The game without its last word, or the reason it can't be undone
 * (chunk 1.7). Each undo adds one to the undo count, which the score adds
 * (D26, chunk 1.13). Undo cannot go past the start word. The game passed
 * in is left as it was: callers replace their current game with the one
 * returned. No undo once the game has ended.
 */
export function undoLastMove(game: Game): UndoLastMoveResult {
  if (game.status !== "in-progress") {
    return { ok: false, reason: "game-over" };
  }

  const [startWord, ...laterWords] = game.chain;
  if (laterWords.length === 0) {
    return { ok: false, reason: "nothing-to-undo" };
  }

  // Rebuilt from its parts so the chain keeps its start word in the type.
  return {
    ok: true,
    game: {
      ...game,
      chain: [startWord, ...laterWords.slice(0, -1)],
      undoCount: game.undoCount + 1,
    },
  };
}
