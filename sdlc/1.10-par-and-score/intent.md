# 1.10 Par and score

**Intent:** work out par from a shortest path (D27), keep it on the game, and score a won game against it (D26, D27), so 3.1 can show par from the start and 3.5 and 4.1 can show and share the score.
**Signature:**
- `getPar(shortestPathMoves: number): number` → `Math.ceil((shortestPathMoves * 3) / 2)`.
- `Game` gains `readonly par: number`, required. `createGame(start, target, par)` stores it; reasons unchanged.
- `getScore(game: Game): GetScoreResult`, where `GetScoreResult = { ok: true; score: number } | { ok: false; reason: "given-up" | "in-progress" }`. The score is `chain.length - 1 + undoCount - par`.

## Rules protected
- Par is 1.5 × the moves in a shortest path, rounded up (D27)
- Par is shown from the start (D9), so a game knows its par from when it's created
- Score is moves in the final chain, plus undos, minus par, and can be below par (D26, D27)
- Giving up ends the game with no score (D11); a game still in progress has no score yet (CLAUDE.md, Ending and scoring: the score is for a won game)

## Acceptance criteria
- `getPar`: par is 1.5 × the moves in a shortest path · par rounds up when the shortest path is odd · a one-move shortest path still leaves a move under par
- `getScore`: a win in par moves scores 0 · a win in two moves over par scores +2 · a win along a shortest path scores below par · each undo adds one to the score · a game is scored against the par it was created with · a game that was given up has no score · a game in progress has no score

"A game is scored against the par it was created with" is added to the backlog's list. Every other score test uses par 6, so a `getScore` that ignored `game.par` and used 6 would pass them all; and building the game through `createGame` is how `createGame` storing par gets tested without a test that only checks a constructor sets its fields (CLAUDE.md, not allowed).

## Choices
1. **`getPar` takes the number of moves in a shortest path,** not a path or start, target and dictionary. 2.2's design note has it run one breadth-first search from the start word for the distance to every word; it has a distance for each candidate target, not a path, so it passes that number straight in. Under D24 option A the schedule stores par and 3.1 passes it to `createGame`; under option B 3.1 has the puzzle from 2.2, which already knows the distance. Taking a path would make 2.2 build paths it doesn't need, and taking the dictionary would mean a search per call, which the 2.2 note rules out.
   - **0 and negative numbers can't happen,** so they aren't expected failures and get no result object: `createGame` rejects a start equal to the target (`same-word`), so a puzzle's shortest path is 1 or more. No guard in `getPar`; 2.2 owns that check (*approved at the human stop*; carried forward on 2.2). For the record, the formula gives 0 for 0, and nonsense (−1 for −1) for negatives.
2. **Rounding without floating-point surprises.** For a whole number, `shortestPathMoves * 3` is a whole number and halving it gives a whole number or exactly x.5, both exact in binary floating point up to 2^53, so `Math.ceil` sees the true value. Written as `* 3 / 2` rather than `* 1.5` so the reader sees only whole numbers and halves are involved. Tested with an even path (4 → 6) and odd ones (5 → 8, 1 → 2).
3. **Par is stored on `Game`** (*changed at the human stop*; first draft passed it to `getScore`). A game can't be scored against another puzzle's par, and the par 3.1 shows is the one `getScore` uses. `createGame` takes par rather than the shortest path's length, because under D24 option A the browser has par from the schedule and no path. `createGame` doesn't check par, as it doesn't check the dictionary: both are left to puzzle generation (2.2), which picks the words and works out par.
4. **No score for an unfinished game is a result with a reason** (CLAUDE.md convention for expected failures): `given-up` and `in-progress`, the same words as `Game.status`. Both are expected: 3.4 and 4.1 call it on a given-up game, and the UI may ask during play.
5. **No check on `undoCount` or `par` inside `getScore`.** In code, `undoCount` starts at 0 and only `undoLastMove` changes it, by +1, and undo is rejected once the game has ended, so it can't change after a win. `par` is set once by `createGame` and copied by every move. Bad values could only come from JSON read from storage, which the 3.9 restore check rejects; this chunk adds par to that carried-forward line.
6. **Fix `findShortestPath`'s doc comment** ("Par is the path's length minus one", wrong since D27) and the matching header comment in its test file. Comments only; they describe the par rule this chunk owns.
7. **Over ~200 lines, approved at the human stop.** Adding `par` to every `Game` literal and `createGame` call in four existing test files is about 40 lines on top of the new tests.

## What I'm least sure of
1. **`createGame` takes par, not the shortest path's length.** Taking the length and calling `getPar` itself would make a wrong par impossible to pass, but then 3.1 would need the length rather than par, and under D24 option A the schedule would have to store the length. If D24 goes to option A and the schedule stores the length anyway, switching is a small change.
2. **No test that `applyMove`, `undoLastMove` and `giveUp` keep par.** They copy the game with `...game`, and the existing whole-game `toEqual` checks now include `par: 6`, so a version that dropped or reset par goes red. The breaks in self-review must show that; if one stays green, I'll add a test like 1.13's. *After review:* setting par to 6 stayed green for `undoLastMove` and `giveUp`, since every literal used 6; one test in each now uses par 9 (review finding 1).
3. **`par` is a plain number on `Game`.** It could be any number at the type level. A branded "whole number of 2 or more" type would catch a bad par from code, but nothing else in `Game` does this, and the risk is JSON from storage or the schedule, which only a runtime check catches (3.9, 2.2).

## Out of scope
- Showing the score as "par", "−1" or "+1": 3.5 (and 4.1 for the share). The score is a plain number here.
- Checking a puzzle's shortest path is 1 or more, and storing par in the puzzle or schedule: 2.2 / D24
- Showing par before the game: 3.1
- Saving and restoring par: 3.9
- Hints in the share: 4.2
