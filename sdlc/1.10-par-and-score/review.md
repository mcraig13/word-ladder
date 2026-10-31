# 1.10 review

## Round 1 (993996d, par passed into `createGame`)

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The work is small, matches its intent and stays in scope. Every file the diff touches is listed in `plan.md`. `applyMove.ts`, `undoLastMove.ts` and `giveUp.ts` are unchanged. The two new functions match their stated signatures and D27's worked examples (4 → 6, 5 → 8; winning in 4, 6 and 7 moves scores −2, 0 and +1). Tests are named after rules, follow AAA with a single Act, and use hand-worked literals. Every chain in `getScore.test.ts` is a valid one-letter-per-step route. Each acceptance criterion has a test. In the scratch copy, type-check, ESLint, Prettier and all 119 tests pass. `npm run lint` passes in the repo at 993996d.

### Findings
1. **nit** Only the value 6 checks that `undoLastMove` and `giveUp` keep par. Every `Game` literal in `undoLastMove.test.ts` and `giveUp.test.ts` uses `par: 6`. A version that sets par to 6 instead of copying it passes every test (reviewer breaks 1 and 2 below, both all green). The self-review break "reset par to 0" went red only because 0 is not 6. `applyMove` is covered, because `getScore.test.ts` plays a move on a par-2 game. Least-sure point 2 in the intent says a test like 1.13's gets added if a break stays green, and these two do. This matters for `undoLastMove`: an undo followed by a win would be scored against the wrong par. Suggested fix: give one existing whole-game `toEqual` test in each file a par other than 6 (for example 9). That needs no new test. — *Response:* fixed as suggested. **Tests changed after human review:** `undoLastMove` › *removes the last word from the chain* and `giveUp` › *giving up ends the game as a loss* now use `par: 9` on input and expected game, with a comment saying why; assertions otherwise unchanged. Reran: `undoLastMove` sets par 6 → red (*removes the last word…*); `giveUp` sets par 6 → red (*giving up ends…*); the earlier reset-to-0 breaks still red.

2. **nit** `tests/core/findShortestPath.test.ts` line 7: the edited header comment runs to 95 characters while the lines around it wrap near 80. The text was re-flowed by hand, but only partly. Cosmetic only. — *Response:* fixed; the whole header comment is rewrapped near 80.

3. **nit** `tests/core/getScore.test.ts`: `const dictionary = createDictionaryFromWords(["cold", "cord"])` sits at file scope, but only the test "a game is scored against the par it was created with" uses it. CLAUDE.md says to keep Arrange inside the test where possible, and moving it there puts the whole story in that one test. — *Response:* fixed; the dictionary is now built in that test's Arrange.

**Notes:** `getPar(0)` is 0 and `getPar(-1)` is −1, as the intent says. 2.2 owns that check and the backlog carries it forward. ~~`createGame` accepts `NaN` as par and stores it (it prints as `null` in JSON). This matches intent choice 3 and the 3.9 carried-forward line.~~ *Out of date since 899e06e: `createGame` no longer takes par.* Intent choice 2 says the result is exact for inputs up to 2^53, but `× 3` goes past 2^53 for inputs above about 3×10^15. That doesn't matter for real paths, and the result was still right for 2^52+1. Breaking `getScore` to check "the last word is the target" instead of `status === "won"` leaves every test green, but that is equivalent for every game the public functions can produce, so it is not a gap. The size is +283/−13 in `src/` and `tests/` (*out of date: now +365 / −18, see `plan.md`*), which goes over the ~200-line guide; the intent and plan record approval for that at the human stop. Naming follows CLAUDE.md (`getPar`, `getScore`, `shortestPathMoves`, `moves`).

### Reviewer's own break-the-code checks
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

## Round 2 (899e06e, par worked out in `createGame`)

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The change matches its intent and stays in scope. Every file in `main..899e06e` is listed in `plan.md`, and `applyMove.ts`, `undoLastMove.ts` and `giveUp.ts` are unchanged. `createGame` runs its word checks first, then `findShortestPath` with the normalised words, passes on `not-a-word` and `unreachable`, and stores `getPar(path.length - 1)`. The check order matches intent choice 3. `getPar` and `getScore` match their signatures and D27's worked examples. Each acceptance criterion has a test. The tests are named after rules, use AAA with one Act, and use hand-worked literals on small fixtures. The routes in their comments are correct: the `bold` route in the par test is 6 moves, so it would give 9. In a scratch copy, `tsc --noEmit`, ESLint (`--max-warnings=0`), the Prettier check, all 124 tests and coverage at 100% all pass.

### Findings
1. **nit** No test checks that a game whose start and target are one letter apart still needs accepted words. Both `not an accepted word` tests in `tests/core/createGame.test.ts` use pairs several moves apart (`colt → warm`, `cold → wart`). I added a shortcut before the search that returns par 2 for any start and target one letter apart, which skips the dictionary check. Every test stayed green (reviewer break 3). This is the "return early" item on the break checklist, and the rule it gets past is D8. Suggested fix: make one of those two tests use an adjacent pair, for example start `cold`, target `colt`. Note this changes a test after human review. — *Response:* fixed as suggested. **Test changed after human review:** `createGame` › *rejects creating a game with a target that is not an accepted word* now uses `cold → colt` (was `cold → wart`), with a comment saying why. Reran the one-move shortcut break → red: that test.

2. **nit** `src/core/getPar.ts` doc comment says "Puzzles always have a shortest path of 1 or more; 2.2 checks that." Since 899e06e, `createGame` makes sure of this itself: it rejects `same-word` before the search (intent choice 1, and the comment on `createGame`). The comment should credit `createGame`'s `same-word` check, not 2.2. — *Response:* fixed: "A path always has a move: createGame rejects a start equal to the target."

3. **note** `sdlc/1.10-par-and-score/review.md`, first-round Notes: two lines are out of date since 899e06e. "`createGame` accepts `NaN` as par and stores it" no longer applies, because `createGame` doesn't take par any more. The size is now +362/−18 in `src/` and `tests/` (`plan.md` already says this), not +283/−13. When this round's findings are added, mark those lines as out of date or correct them, so the PR's linked review doesn't contradict the code. — *Response:* fixed: both lines in round 1 are marked out of date.

4. **note** `createGame`'s `invalid-word` and `different-lengths` guards now repeat checks that `findShortestPath` makes too, with the same reasons and in the same order. Deleting either one leaves every test green, and so does running the search from target to start (reviewer breaks 4–6). Both are equivalent breaks, not gaps: the search reports the same reason, and one-letter-apart and path length work the same in both directions. Keeping the guards is reasonable, since they avoid the search for bad input and keep `createGame`'s reasons visible in its own code. If they stay, a one-line comment saying so would stop a later reader from "simplifying" them away. `plan.md`'s self-review doesn't list these as equivalent breaks the way it does for `Math.round`. — *Response:* kept the guards and added that comment to `createGame`. The three equivalent breaks are now listed in `plan.md`'s self-review.

**Notes:** `createGame` on awkward input: `"  Cold "` / `"WARM\n"` gives par 6 with words lowercased; upper-case and space-padded dictionary words are matched; an empty dictionary gives `not-a-word`, `cöld` gives `invalid-word`, `warms` gives `different-lengths`. 5-letter and 1-letter puzzles give par 2 for one move (D4). A full game through the public functions (create, play `cord`, `card`, undo, then `card`, `ward`, `warm`) scored −1, matching 4 + 1 − 6 by hand. `giveUp` then `getScore` gives `given-up`. `getPar` for 0–10 gives 0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, so D16's 4–6 moves gives par 6–9. Naming follows CLAUDE.md. The file-scope dictionary in `createGame.test.ts` is noise setup, which CLAUDE.md allows. Search cost per game load is unmeasured and carried forward on 6.1b. Over the size guide, recorded as approved at the human stop.

### Reviewer's own break-the-code checks
Run with `scripts/break.mjs` in a scratch copy, which has since been deleted. 9 breaks, all applied, 4 all green.
1. `createGame` par from `path.length - 2` (off by one) → red: `a new game's par comes from a shortest path…`, `a game is scored against the par it was created with`
2. `createGame` `same-word` compares the raw `start === target` (wrong input) → red: `…start and target are the same word`, `reports same-word before checking the dictionary`
3. `createGame` returns par 2 for one-letter-apart start and target before the search (return early) → **all green** (finding 1)
4. `createGame` deletes the `different-lengths` guard → all green; equivalent, because the search reports the same reason (finding 4)
5. `createGame` replaces the `invalid-word` guard with the search's result → all green; equivalent (finding 4)
6. `createGame` searches target to start (swapped arguments) → all green; equivalent, because path length and the dictionary check work the same in both directions (finding 4)
7. `getScore` returns `Math.abs(score)` → red: `a win along a shortest path scores below par`, `a game is scored against the par it was created with`
8. `getScore` works out par from the player's chain instead of `game.par` → red: `a win in par moves scores 0`, `a win in two moves over par scores +2`
9. `getPar` becomes `Math.ceil(moves / 2) * 3` (rounding in the wrong order) → red: `par rounds up when the shortest path is odd`, `a one-move shortest path still leaves a move under par`, `a game is scored against the par it was created with`
