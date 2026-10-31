# 1.8 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve

In scope and correct; only the files in `plan.md` change, and `applyMove` and `undoLastMove` need no change. Every acceptance criterion has a test; tsc, lint and 87/87 tests pass.

## Findings
1. **note** The returned game shares the given game's `chain` array rather than copying it. Safe, because `chain` is readonly and every change builds a new array. — *Response:* Agreed, no change. Same as `applyMove`, which also spreads the game.
2. **note** `can give up at the start word before any move` uses `toMatchObject`, so it doesn't check start and target; `giving up ends the game as a loss` checks the whole game. — *Response:* Agreed, no change; matches 1.7's start-word undo test.
3. **note** Games the public functions can't produce (last word is the target but in progress, empty chain, unknown status) behave predictably: the first two are given up, the unknown status returns `game-over`. — *Response:* Agreed, no change. Restoring a saved game must check these (4.3), as already carried from 1.6.

## Reviewer's own break-the-code checks
- Swap start and target → red: `giving up ends the game as a loss`
- Drop the last word when giving up → red: `…ends the game as a loss`, `…at the start word…`
- "Already ended" from last word = target → red: `…already been given up`
- Throw for an ended game → red: `…already won`, `…already been given up`
