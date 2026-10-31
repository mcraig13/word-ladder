# 1.13 plan

## Approach
Add `readonly undoCount: number` to `Game`. `createGame` sets it to 0. `undoLastMove` returns `undoCount: game.undoCount + 1` with the shortened chain. `applyMove` and `giveUp` already spread the game, so they keep the count with no change. Update `undoLastMove`'s doc comment, which says undo is free (D12, superseded by D26). Tests write games as literals, as in 1.6–1.8.

New tests start from `undoCount: 2`, not 0, so that setting the count (to 1, or back to 0) instead of adding to or keeping it goes red.

## Files
- `src/core/createGame.ts` — `undoCount` on `Game`, 0 in a new game
- `src/core/undoLastMove.ts` — add one on undo; doc comment for D26
- `tests/core/createGame.test.ts` — one new test; header comment
- `tests/core/undoLastMove.test.ts` — one new test; field on literals; one expected value changes (below); header comment
- `tests/core/applyMove.test.ts` — two new tests; field on literals
- `tests/core/giveUp.test.ts` — one new test; field on literals
- `backlog.md` — M1 Status column; 3.9 carried-forward line gains the saved-count check (intent choice 4)
- `sdlc/1.13-count-undos/` — these records

## Tests
Dictionary as in each file: cold, cord, card, ward, warm (applyMove adds worm). Target `warm`.

| Test | Game in | Act | Expected | Rule |
|---|---|---|---|---|
| a new game has used no undos | — | `createGame("cold", "warm")` | `undoCount: 0` | New game has no undos (D26) |
| each undo adds one to the undo count | cold, cord, card; count 2 | undo | `undoCount: 3` | Each undo adds one (D26) |
| a move does not change the undo count | cold; count 2 | play cord | chain cold, cord; `undoCount: 2` | Moves don't add undos (D26) |
| the undo count is kept when the game is won | cold, cord, card, ward; count 2 | play warm | status `won`; `undoCount: 2` | Count survives the win, for the score (D26) |
| the undo count is kept when the game is given up | cold, cord; count 2 | give up | status `given-up`; `undoCount: 2` | Count kept as played (D26, D11) |

The three `applyMove`/`giveUp` tests pass before implementing, because the spread already copies the field. They guard against a later change that rebuilds the game field by field; the breaks below must show them going red.

### Existing tests changed
Adding the field only (`undoCount: 0` on input and, where the test compares the whole game, on the expected game; assertion otherwise unchanged), 24 tests, 29 literals:
- `applyMove`: applying a valid move extends the chain; stores the played word in lowercase…; applying a move leaves the game it was given as it was; an invalid move returns the reason from checkMove; an invalid move checks repeats against the whole chain; an invalid move leaves the chain unchanged; the game is won when the chain reaches the target; the game is won when the target is typed in a different case or with spaces; the game is still in progress before the target is reached; no moves are accepted after the game is won; reports game-over before any other reason
- `undoLastMove`: can undo the first move back to the start word; undoing leaves the game it was given as it was; cannot undo past the start word; an undone word can be played again; undo is not available after the game has been won; undo is not available after giving up; undo is not available after giving up at the start word
- `giveUp`: giving up ends the game as a loss; can give up at the start word before any move; giving up leaves the game it was given as it was; no moves are accepted after giving up; cannot give up a game that is already won; cannot give up a game that has already been given up

**Expected result changes, 1 test:** `undoLastMove` › *removes the last word from the chain*. Input `undoCount: 0`, expected game now `undoCount: 1` (was no field). D26 makes the undo count part of what an undo returns; the test still checks the whole game.

`createGame`'s existing tests use `toMatchObject`, so they need no change.

### Size
Measured with the tests written: `tests/` +190 / −17. Of that, about 103 lines are the field on existing literals (Prettier splits each one-line literal into six lines once it passes 100 characters), and about 87 are the five new tests, the changed expected value and comments. `src/` adds about 6. Total about 196, inside ~200.

A shared test helper that builds a `Game` would make later fields cheaper, but converting every literal now means rewriting most of three test files, and CLAUDE.md prefers Arrange inside the test. Proposed only if you'd rather; not planned.

## Self-review
Diff matches the intent and touches only the files listed; `applyMove.ts` and `giveUp.ts` are unchanged. Final size: `src/` and `tests/` +200 / −19. All 14 breaks applied, went red and were restored (`npm run break`); no test needed strengthening.
- Break: `createGame` starts the count at 1 → red: `a new game has used no undos`
- Break: undo sets the count to 1 → red: `each undo adds one…`
- Break: undo adds two → red: `removes the last word…`, `each undo adds one…`
- Break: undo leaves the count unchanged → red: `removes the last word…`, `each undo adds one…`
- Break: undo resets the count to 0 → red: `removes the last word…`, `each undo adds one…`
- Break: `applyMove` resets the count to 0 → red: `a move does not change…`, `…kept when the game is won`
- Break: `applyMove` adds one → red: `applying a valid move extends the chain`, `a move does not change…`, `…kept when the game is won`
- Break: `applyMove` resets only on a winning move → red: `…kept when the game is won`
- Break: `applyMove` rebuilds the game field by field without `...game` (forget state) → red: `applying a valid move…`, `a move does not change…`, `…kept when the game is won`
- Break: `giveUp` resets the count to 0 → red: `…kept when the game is given up`
- Break: undo drops the game-over check → red: all three `undo is not available after…` tests
- Break: undo drops the nothing-to-undo check → red: `cannot undo past the start word`
- Break: undo resets the chain to the start word → red: `removes the last word…`, `an undone word can be played again`
- Break: undo removes the start word instead of the last → red: `removes the last word…`, `can undo the first move…`, `an undone word…`

Reorder and return-early breaks don't apply to the new code: the count is only set on the success path, after both guards, and a rejection returns no game. The existing guard-order test (`…after giving up at the start word`) still pins undo's check order.

## Step 5
Skipped (D23). All four criteria hold: S chunk; follows the 1.7/1.8 pattern (one field on `Game`, copied by spread, set in one place); no search, loop or recursion; every self-review break went red.
