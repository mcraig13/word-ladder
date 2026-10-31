# 1.10 plan

## Approach
`Game` gains `readonly par: number`, and `createGame(start, target, par)` stores it (intent choice 3, changed at the human stop). `applyMove`, `undoLastMove` and `giveUp` copy the game with `...game`, so they keep par with no code change.

Two new files in `src/core/`, one function each, as in 1.4–1.9. `getPar` is one line: `Math.ceil((shortestPathMoves * 3) / 2)`. `getScore(game)` checks `game.status` first: anything but `won` returns `{ ok: false, reason: game.status }`; `won` returns `{ ok: true, score: game.chain.length - 1 + game.undoCount - game.par }`. No loops, no search.

Tests write games as literals, as in 1.6–1.13. `getScore` doesn't check the chain against a dictionary, but every chain in the tests is a real one-letter-at-a-time route from `cold` (worked out by hand below), so the stories are possible games. One test builds its game with `createGame` and `applyMove`, so that `createGame` storing par is tested through a score rather than by checking a constructor sets its fields.

## Files
- `src/core/createGame.ts` — `par` on `Game`; `createGame` takes and stores it; doc comment
- `src/core/getPar.ts` — new
- `src/core/getScore.ts` — new
- `src/core/findShortestPath.ts` — doc comment: the path's moves give par through `getPar` (D27), not "length minus one"
- `tests/core/getPar.test.ts` — new, 3 tests
- `tests/core/getScore.test.ts` — new, 7 tests
- `tests/core/createGame.test.ts` — `createGame(start, target, 6)` in 8 calls; assertions unchanged
- `tests/core/applyMove.test.ts`, `undoLastMove.test.ts`, `giveUp.test.ts` — `par` on 35 `Game` literals (input and whole-game expected values): 6, except par 9 in one whole-game test each in `undoLastMove` and `giveUp` (review finding 1); assertions otherwise unchanged
- `tests/core/findShortestPath.test.ts` — header comment only
- `backlog.md` — M1 Status: Done; carried-forward lines on 2.2 (check the shortest path is 1 or more) and 3.9 (restore keeps and checks par)
- `sdlc/1.10-par-and-score/` — these records

## Tests
Par for `cold → warm` is 6 (shortest path 4 moves). Score = (chain length − 1) + undos − par.

| Test | Input | Worked by hand | Expected | Rule |
|---|---|---|---|---|
| par is 1.5 × the moves in a shortest path | 4 | 1.5 × 4 = 6 | `6` | Par is 1.5 × shortest path (D27) |
| par rounds up when the shortest path is odd | 5 | 1.5 × 5 = 7.5 → 8 | `8` | Rounded up (D27) |
| a one-move shortest path still leaves a move under par | 1 | 1.5 → 2 | `2` | Rounded up, smallest puzzle (D27) |
| a win in par moves scores 0 | won; cold, bold, bald, bard, card, ward, warm; undos 0; par 6 | 6 + 0 − 6 | `{ ok: true, score: 0 }` | Score = moves + undos − par (D26, D27) |
| a win in two moves over par scores +2 | won; cold, hold, bold, bald, bard, hard, card, ward, warm; undos 0; par 6 | 8 + 0 − 6 | `{ ok: true, score: 2 }` | Score (D27) |
| a win along a shortest path scores below par | won; cold, cord, card, ward, warm; undos 0; par 6 | 4 + 0 − 6 | `{ ok: true, score: -2 }` | Score can be below par (D27) |
| each undo adds one to the score | won; cold, cord, card, ward, warm; undos 3; par 6 | 4 + 3 − 6 | `{ ok: true, score: 1 }` | Each undo adds one (D26) |
| a game is scored against the par it was created with | `createGame("cold", "cord", 2)`, then play cord | 1 + 0 − 2 | `{ ok: true, score: -1 }` | Score uses the game's own par, set at creation (D9, D27) |
| a game that was given up has no score | given-up; cold, cord, card; par 6 | — | `{ ok: false, reason: "given-up" }` | Giving up has no score (D11) |
| a game in progress has no score | in-progress; cold, cord, card; par 6 | — | `{ ok: false, reason: "in-progress" }` | Only a won game is scored |

Undos 3 rather than 1 or 2 so the result (+1) differs from ignoring undos (−2), counting them twice (+4) and subtracting them (−5).

### Size
`src/` and `tests/`: +273 / −15 after review. Of that, about 60 lines are `par` on existing literals and calls; the rest is the two new functions (30) and their tests (187). Over ~200, approved at the human stop.

## Self-review
Diff matches the intent and touches only the files listed; `applyMove.ts`, `undoLastMove.ts` and `giveUp.ts` are unchanged. Lint and all 119 tests pass. 22 breaks run with `npm run break`: 21 went red, 1 stayed green as predicted (below). No test needed strengthening at the time, but the review found par-keeping was only checked against 0 (review finding 1; strengthened after review, below).
- Break: `getPar` uses `Math.floor` → red: `par rounds up…`, `a one-move shortest path…`
- Break: `getPar` drops the rounding → red: `par rounds up…`, `a one-move shortest path…`
- Break: `getPar` adds one → red: all three `getPar` tests
- Break: `getPar` subtracts one → red: all three `getPar` tests
- Break: par equals the shortest path (D9 as it was) → red: all three `getPar` tests
- Break: `getPar` uses `Math.round` → **all green**. Equivalent: a whole number × 1.5 ends in .0 or .5, and `Math.round` rounds .5 up (towards +∞, also for negatives), so it always equals `Math.ceil`. No input can tell them apart, so this is not a gap.
- Break: score counts words, not moves (drop `- 1`) → red: all five win tests
- Break: score ignores undos → red: `each undo adds one…`
- Break: score subtracts undos → red: `each undo adds one…`
- Break: score counts undos twice → red: `each undo adds one…`
- Break: score hard-codes par 6 → red: `a game is scored against the par it was created with`
- Break: score adds par → red: all five win tests
- Break: delete the status guard → red: `given up has no score`, `in progress has no score`
- Break: guard checks only `given-up` (in-progress is scored) → red: `in progress has no score`
- Break: every unfinished game reports `in-progress` → red: `given up has no score`
- Break: every unfinished game reports `given-up` → red: `in progress has no score`
- Break: return a score before the status check (return early) → red: both no-score tests
- Break: `createGame` stores par 6 instead of its argument → red: `…par it was created with`
- Break: `createGame` stores par 0 → red: `…par it was created with`
- Break: `applyMove` resets par to 0 (forget state) → red: `applying a valid move extends the chain`, `…par it was created with`
- Break: `undoLastMove` resets par to 0 → red: `removes the last word from the chain`
- Break: `giveUp` resets par to 0 → red: `giving up ends the game as a loss`

**After review (finding 1):** every `undoLastMove` and `giveUp` literal used par 6, so setting par to 6 instead of keeping it stayed green. One whole-game test in each file now uses par 9. Reran: `undoLastMove` sets par 6 → red: `removes the last word…`; `giveUp` sets par 6 → red: `giving up ends…`; `applyMove` sets par 6 → red: `…par it was created with`; both reset-to-0 breaks still red.

Reorder doesn't apply: `getScore` has one check. Use the wrong input: the hard-coded-par break covers using a fixed par rather than the game's.

## Step 5
Run. D23 criteria: S chunk — holds; follows an existing pattern (a field on `Game` copied by spread, as 1.13; a result with a reason, as 1.8) — holds; no search, loop or recursion — holds; every self-review break went red — **doesn't hold**, strictly: the `Math.round` break stayed green, though it's equivalent. The chunk also changes `createGame`'s signature and is over the size limit, so "if in doubt, run it" applies.
