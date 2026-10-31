# 1.8 giveUp

**Intent:** let a player end a game they can't or don't want to finish. It ends as a loss with no score, and the Give up button (3.4) builds on it.
**Signature:**
- `giveUp(game)` → `{ ok: true, game }` holding the game with status `given-up` and its chain, start and target as they were, or `{ ok: false, reason: "game-over" }` when the game has already ended (won or given up). Like `applyMove` and `undoLastMove`, the game passed in is never changed: the caller replaces its current game with the one returned.
- `Game.status` gains `given-up`: `in-progress` | `won` | `given-up`.

## Rules protected
- Giving up ends the game as a loss (D11)
- No moves and no undo once the game has ended (backlog 1.6, 1.7, 1.8)
- A won game can't be turned into a loss (backlog 1.8)
- An expected failure returns a reason rather than throwing (CLAUDE.md, Conventions)

## Acceptance criteria
- giving up ends the game as a loss
- can give up at the start word before any move
- giving up leaves the game it was given as it was
- no moves are accepted after giving up, with reason `game-over`
- cannot give up a game that is already won, with reason `game-over`
- cannot give up a game that has already been given up, with reason `game-over`
- undo is not available after giving up, with reason `game-over` *(carried from 1.7 review)*
- undo is not available after giving up at the start word, with reason `game-over` *(carried from 1.7 review)*

"Ends the game as a loss" checks the whole returned game, so it goes red if giving up changes the chain, start or target. The two undo tests go in `tests/core/undoLastMove.test.ts`. A given-up game's last word isn't the target, so they show "ended" comes from the status; at the start word, they pin undo's order (`game-over` before `nothing-to-undo`).

## Choices for you (beyond the backlog entry)
1. **Status name `given-up`**, as 1.6 planned. Alternative: `lost`. D11 says giving up is the only way to lose, so `given-up` says more.
2. **One reason, `game-over`, for any ended game**, matching `applyMove` and `undoLastMove`. Alternative: separate `already-won` / `already-given-up`. The UI only needs to know the game is over.
3. **The chain is kept as played**, not cleared, so the end screen and stats can show how far the player got.
4. **Giving up at the start word is allowed.** D11 doesn't require a move first.
5. **The two undo tests live in the undo test file** (no change to `undoLastMove.ts` expected).

## Out of scope
- Showing a shortest path after giving up: 3.4, using the solver (1.9)
- "No score" for a given-up game: `getScore` (1.10)
- Asking for confirmation: 3.4. Sharing "didn't finish": 4.1. Counting as a loss in stats and streaks: 4.3
