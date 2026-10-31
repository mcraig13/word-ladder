import type { Game } from "./createGame";

export type GetScoreResult =
  { ok: true; score: number } | { ok: false; reason: "given-up" | "in-progress" };

/**
 * The score for a won game, or the reason there is none (chunk 1.10). The
 * score is moves in the final chain, plus undos, minus the game's par
 * (D26, D27): 0 is par, and below 0 is under par. A game that was given up
 * has no score (D11), and nor does one still in progress.
 */
export function getScore(game: Game): GetScoreResult {
  if (game.status !== "won") {
    return { ok: false, reason: game.status };
  }

  const moves = game.chain.length - 1;
  return { ok: true, score: moves + game.undoCount - game.par };
}
