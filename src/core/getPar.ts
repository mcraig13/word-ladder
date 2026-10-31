/**
 * Par for a puzzle: 1.5 × the moves in a shortest path, rounded up (D27,
 * chunk 1.10). A shortest path of 4 moves gives par 6, and 5 gives par 8.
 * A path always has a move: createGame rejects a start equal to the target.
 *
 * Times 3, then halved: a whole number or exactly a half, so Math.ceil
 * rounds the true value with no floating-point error.
 */
export function getPar(shortestPathMoves: number): number {
  return Math.ceil((shortestPathMoves * 3) / 2);
}
