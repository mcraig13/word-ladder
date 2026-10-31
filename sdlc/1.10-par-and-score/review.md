# 1.10 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The work is small, matches its intent and stays in scope. Every file the diff touches is listed in `plan.md`. `applyMove.ts`, `undoLastMove.ts` and `giveUp.ts` are unchanged. The two new functions match their stated signatures and D27's worked examples (4 → 6, 5 → 8; winning in 4, 6 and 7 moves scores −2, 0 and +1). Tests are named after rules, follow AAA with a single Act, and use hand-worked literals. Every chain in `getScore.test.ts` is a valid one-letter-per-step route. Each acceptance criterion has a test. In the scratch copy, type-check, ESLint, Prettier and all 119 tests pass. `npm run lint` passes in the repo at 993996d.

## Findings
1. **nit** Only the value 6 checks that `undoLastMove` and `giveUp` keep par. Every `Game` literal in `undoLastMove.test.ts` and `giveUp.test.ts` uses `par: 6`. A version that sets par to 6 instead of copying it passes every test (reviewer breaks 1 and 2 below, both all green). The self-review break "reset par to 0" went red only because 0 is not 6. `applyMove` is covered, because `getScore.test.ts` plays a move on a par-2 game. Least-sure point 2 in the intent says a test like 1.13's gets added if a break stays green, and these two do. This matters for `undoLastMove`: an undo followed by a win would be scored against the wrong par. Suggested fix: give one existing whole-game `toEqual` test in each file a par other than 6 (for example 9). That needs no new test. — *Response:* fixed as suggested. **Tests changed after human review:** `undoLastMove` › *removes the last word from the chain* and `giveUp` › *giving up ends the game as a loss* now use `par: 9` on input and expected game, with a comment saying why; assertions otherwise unchanged. Reran: `undoLastMove` sets par 6 → red (*removes the last word…*); `giveUp` sets par 6 → red (*giving up ends…*); the earlier reset-to-0 breaks still red.

2. **nit** `tests/core/findShortestPath.test.ts` line 7: the edited header comment runs to 95 characters while the lines around it wrap near 80. The text was re-flowed by hand, but only partly. Cosmetic only. — *Response:* fixed; the whole header comment is rewrapped near 80.

3. **nit** `tests/core/getScore.test.ts`: `const dictionary = createDictionaryFromWords(["cold", "cord"])` sits at file scope, but only the test "a game is scored against the par it was created with" uses it. CLAUDE.md says to keep Arrange inside the test where possible, and moving it there puts the whole story in that one test. — *Response:* fixed; the dictionary is now built in that test's Arrange.

**Notes:** `getPar(0)` is 0 and `getPar(-1)` is −1, as the intent says. 2.2 owns that check and the backlog carries it forward. `createGame` accepts `NaN` as par and stores it (it prints as `null` in JSON). This matches intent choice 3 and the 3.9 carried-forward line. Intent choice 2 says the result is exact for inputs up to 2^53, but `× 3` goes past 2^53 for inputs above about 3×10^15. That doesn't matter for real paths, and the result was still right for 2^52+1. Breaking `getScore` to check "the last word is the target" instead of `status === "won"` leaves every test green, but that is equivalent for every game the public functions can produce, so it is not a gap. The size is +283/−13 in `src/` and `tests/`, which goes over the ~200-line guide; the intent and plan record approval for that at the human stop. Naming follows CLAUDE.md (`getPar`, `getScore`, `shortestPathMoves`, `moves`).

## Reviewer's own break-the-code checks
Run with `scripts/break.mjs` in a scratch copy, which has since been deleted.
- `undoLastMove` sets `par: 6` instead of copying it (use the wrong input) → **all green** (finding 1)
- `giveUp` sets `par: 6` instead of copying it → **all green** (finding 1)
- `applyMove` sets `par: 6` instead of copying it → red: `a game is scored against the par it was created with`
- `createGame` stores `Math.max(par, 6)` → red: `a game is scored against the par it was created with`
- `getScore` caps undos at one → red: `each undo adds one to the score`
- `getScore` counts moves as `chain.length - 2` (off by one) → red: all five win tests
- `getScore` never scores below par (`Math.max(0, …)`) → red: `a win along a shortest path scores below par`, `a game is scored against the par it was created with`
- `getScore` checks "last word is the target" instead of status (move a guard) → all green; equivalent for every game the public functions can produce (see Notes)
- `getPar` becomes `Math.floor(moves × 3 / 2) + 1` → red: `par is 1.5 × the moves in a shortest path`
- `getPar` always returns 6 → red: `par rounds up when the shortest path is odd`, `a one-move shortest path still leaves a move under par`
