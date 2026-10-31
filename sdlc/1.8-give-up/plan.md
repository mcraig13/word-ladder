# 1.8 plan

## Approach
Add `given-up` to `Game.status`. `giveUp` returns `game-over` unless the game is in progress; otherwise it returns a new game with status `given-up` and everything else copied across. `applyMove` and `undoLastMove` already reject any game that isn't in progress, so they need no change. Tests write games as literals, as in 1.6 and 1.7.

## Files
- `src/core/createGame.ts` — add `given-up` to the status type
- `src/core/giveUp.ts` — new
- `tests/core/giveUp.test.ts` — new
- `tests/core/undoLastMove.test.ts` — two tests carried from the 1.7 review
- `sdlc/1.8-give-up/` — these records

## Tests
Dictionary (only the move test uses it): cold, cord, card, ward, warm. Target `warm`.

| Test | Chain (status) | Expected | Rule |
|---|---|---|---|
| giving up ends the game as a loss | cold, cord, card | whole game: same chain, start, target; status `given-up` | Giving up is a loss (D11) |
| can give up at the start word before any move | cold | status `given-up`, chain cold | No move needed first (intent choice 4) |
| giving up leaves the game it was given as it was | cold, cord | given game unchanged | Pure function |
| no moves are accepted after giving up | cold, cord → give up, then play card | `game-over` | No moves once ended (backlog 1.8) |
| cannot give up a game that is already won | …, ward, warm (won) | `game-over` | A win can't become a loss (backlog 1.8) |
| cannot give up a game that has already been given up | cold, cord (given-up) | `game-over` | Only an in-progress game can be given up |
| undo is not available after giving up | cold, cord (given-up) | `game-over` | No undo once ended; ended comes from status (1.7 review 1, 2) |
| undo is not available after giving up at the start word | cold (given-up) | `game-over` | `game-over` before `nothing-to-undo` (1.7 review 1) |

The move test calls `giveUp` in Arrange so the Act is the move, as in 1.7's replay test. `card` would be a valid move, so only the ended game can reject it.

## Self-review
Diff matches the intent and touches only the files listed. Every break below applied (checked by a file diff before each run) and was restored; no test needed strengthening.
- Break: drop the game-over check in `giveUp` → red: `…already won`, `…already been given up`
- Break: reject only `won` → red: `…already been given up`
- Break: reject only `given-up` → red: `…already won`
- Break: status stays `in-progress` → red: `…ends the game as a loss`, `…at the start word…`, `no moves are accepted after giving up`
- Break: status set to `won` → red: `…ends the game as a loss`, `…at the start word…`
- Break: clear the chain to the start word → red: `…ends the game as a loss`
- Break: refuse to give up at the start word → red: `…at the start word…`
- Break: change the given game in place → red: `…leaves the game it was given as it was`
- Break: undo checks `nothing-to-undo` before `game-over` → red: `undo is not available after giving up at the start word`
- Break: undo treats "last word is the target" as ended → red: both undo-after-giving-up tests
- Break: undo rejects only `won` → red: both undo-after-giving-up tests
- Break: `applyMove` rejects only `won` → red: `no moves are accepted after giving up`
