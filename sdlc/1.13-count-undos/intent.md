# 1.13 Count undos

**Intent:** the game records how many undos the player has used, so `getScore` (1.10) can add one per undo (D26). The chain alone no longer gives the score. Undo itself works as before.
**Signature:**
- `Game` gains `readonly undoCount: number`, required.
- `createGame` → a new game with `undoCount: 0`.
- `undoLastMove(game)` → on success, the game with its last word removed and `undoCount` one higher. Rejections (`game-over`, `nothing-to-undo`) are unchanged.
- `applyMove` and `giveUp` keep `undoCount` as it was. No code change: both already copy the game with `...game`.

## Rules protected
- Each undo adds one to the score (D26), so each successful undo adds one to the count
- A new game has used no undos (D26)
- Moves, winning and giving up don't change the count (D26: score is moves in the final chain, plus undos, minus par)
- Undo removes the last word, cannot go past the start word, an undone word can be played again, no undo once the game has ended (D12, kept by D26). Existing 1.7 and 1.8 tests, unchanged apart from the new field

## Acceptance criteria
- a new game has used no undos
- each undo adds one to the undo count
- a move does not change the undo count
- the undo count is kept when the game is won
- the undo count is kept when the game is given up

The backlog's "the undo count is kept when the game is won or given up" becomes two tests, one per function: one Act each.

## Choices for you (beyond the backlog entry)
1. **Record an undo count, `undoCount`, not a count of every move played.** D26 says these give the same score. The undo count is the one fact the chain doesn't already hold, so nothing can disagree: a moves-played count would repeat the chain's length and could drift from it (e.g. 3 moves played with a 5-word chain). It's also the number the player sees: 3.3 shows what an undo costs, and the share may show undos. `getScore` (1.10) will read `chain.length - 1 + undoCount - par`. The name follows the backlog's "undo count" and reads as `game.undoCount`; it isn't a yes/no value, so no `is`/`has` prefix.
2. **Required, not optional.** An optional field would let a game built without it score as if no undos happened. Every `Game` literal in `tests/core/` gets the field (see plan for the size).
3. **No new test for a rejected undo.** `nothing-to-undo` and `game-over` return `{ ok: false, reason }` with no game, so there is no count to change. The existing tests check those results with `toEqual`, so returning a game with them would already go red.
4. **3.9 restore: nothing needed now.** The carried-forward line on 3.9 already says the saved game must keep its undo count. Suggested addition to that line, since `Game`'s type checks only code and not JSON read from storage (as for the chain): restore must also reject a saved count that isn't a whole number of 0 or more. *Approved at the human stop: added to the 3.9 carried-forward line in this chunk.*

## Out of scope
- `getScore` and `getPar`: 1.10
- Showing the cost of undo before pressing it: 3.3
- Saving and restoring the count: 3.9
