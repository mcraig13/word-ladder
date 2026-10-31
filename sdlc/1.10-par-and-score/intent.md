# 1.10 Par and score

**Intent:** work out par from a shortest path (D27), keep it on the game from the start, and score a won game against it (D26, D27), so 3.1 can show par from the start and 3.5 and 4.1 can show and share the score.
**Signature:**
- `getPar(shortestPathMoves: number): number` → `Math.ceil((shortestPathMoves * 3) / 2)`.
- `Game` gains `readonly par: number`, required.
- `createGame(start, target, dictionary)` finds a shortest path with `findShortestPath` and stores `par: getPar(moves)`. New reasons, passed on from `findShortestPath`: `not-a-word` and `unreachable`. They're checked after `invalid-word`, `different-lengths` and `same-word`.
- `getScore(game: Game): GetScoreResult`, where `GetScoreResult = { ok: true; score: number } | { ok: false; reason: "given-up" | "in-progress" }`. The score is `chain.length - 1 + undoCount - par`.

## Rules protected
- Par is 1.5 × the moves in a shortest path over the accepted words, rounded up (D27)
- Par is shown from the start (D9), so a game knows its par from when it's created
- Start and target are accepted words and every puzzle is solvable (D8), so a game can't be created otherwise
- Score is moves in the final chain, plus undos, minus par, and can be below par (D26, D27)
- Giving up ends the game with no score (D11); a game still in progress has no score yet (CLAUDE.md, Ending and scoring: the score is for a won game)

## Acceptance criteria
- `getPar`: par is 1.5 × the moves in a shortest path · par rounds up when the shortest path is odd · a one-move shortest path still leaves a move under par
- `createGame`: a new game's par comes from a shortest path between start and target · rejects creating a game with a start that is not an accepted word · rejects creating a game with a target that is not an accepted word · rejects creating a game whose target can't be reached · reports same-word before checking the dictionary
- `getScore`: a win in par moves scores 0 · a win in two moves over par scores +2 · a win along a shortest path scores below par · each undo adds one to the score · a game is scored against the par it was created with · a game that was given up has no score · a game in progress has no score

"A game is scored against the par it was created with" is added to the backlog's list. Every other score test uses a literal par of 6, so a `getScore` that ignored `game.par` and used 6 would pass them all. Building the game through `createGame` also tests that par flows from the dictionary to the score.

## Choices
1. **`getPar` takes the number of moves in a shortest path,** not a path or start, target and dictionary. That's the one number par depends on, and it keeps rounding testable without a dictionary. `createGame` is its only caller in `src/` and passes `path.length - 1`.
   - **0 and negative numbers can't reach it:** `createGame` rejects `same-word` before searching, so the path always has a move. There's no guard in `getPar`. For the record, the formula gives 0 for 0 and nonsense (−1 for −1) for negatives.
2. **Rounding without floating-point surprises.** For a whole number, `shortestPathMoves * 3` is a whole number, and halving it gives a whole number or exactly x.5. Both are exact in binary floating point for any realistic path, so `Math.ceil` sees the true value. It's written as `* 3 / 2` rather than `* 1.5` so the reader sees that only whole numbers and halves are involved. Tested with an even path (4 → 6) and odd ones (5 → 8, 1 → 2).
3. **`createGame` works out par from the dictionary** (*changed twice at the human stop*). The first draft passed par to `getScore`. The second stored a par passed into `createGame`. Both let a caller pair a puzzle with the wrong par: a schedule typo, a 2.2 bug, or a stale schedule after a word-list change (D24). Every score that day would be quietly off. Working it out inside `createGame` means par can't disagree with the words. It also makes `createGame` reject a start or target that isn't an accepted word, and a target that can't be reached, which until now it left to puzzle generation.
   - **Cost:** one `findShortestPath` per game created. 1.9 estimated about 200 ms on a PC for the real list, maybe up to 1 s on a phone, and 6.1b measures it. The end screen needs a shortest path anyway (D9), so the browser runs this search once per game whatever we pick. D24 option A's schedule no longer needs to store par. That's noted on D24.
   - **Check order:** the word checks (`invalid-word`, `different-lengths`, `same-word`) run first, as before. The search runs last, because it's the expensive step and because `same-word` would otherwise pass (`findShortestPath` returns a one-word path when start equals target, which gives par 0).
   - **The shortest path is not stored on `Game`.** Storing it would let 3.4 and 3.5 skip a second search, but it adds a field to every `Game` literal, and which path to show belongs to those chunks.
4. **No score for an unfinished game is a result with a reason** (CLAUDE.md convention for expected failures). The reasons are `given-up` and `in-progress`, the same words as `Game.status`. Both are expected: 3.4 and 4.1 call it on a given-up game, and the UI may ask during play.
5. **No check on `undoCount` or `par` inside `getScore`.** In code, `undoCount` starts at 0 and only `undoLastMove` changes it, by +1. Undo is rejected once the game has ended, so the count can't change after a win. `par` is set once by `createGame` and copied by every move. A bad value could only come from JSON read from storage. The 3.9 line now says restore takes par from `createGame` for today's puzzle, not from storage.
6. **Fix `findShortestPath`'s doc comment** ("Par is the path's length minus one", wrong since D27) and the matching header comment in its test file. These are comments only; they describe the par rule this chunk owns.
7. **Over ~200 lines, approved at the human stop.** Adding `par` to every `Game` literal, and a dictionary to every `createGame` call, comes to about 70 lines on top of the new tests.

## What I'm least sure of
1. **A search on every game load.** The cost isn't measured on the real list yet; that's 6.1b's carried-forward timing. If it's too slow on a phone, the fix is the speed-up 6.1b already names, not going back to a par passed in.
2. **`createGame` now takes the accepted dictionary.** 1.6 deliberately left the dictionary out of `createGame`. Everything that creates a game, including 2.2's candidate checks and 3.9's restore, now needs the accepted words loaded first (1.11). I think that's right, since a game can't be played without them, but it changes what 3.1 has to wire up.
3. **Rejection reasons passed straight through from `findShortestPath`.** `createGame`'s result now includes `not-a-word` and `unreachable`, which only a bug in 2.2 or the schedule can produce. 3.1 will need some message for them. I'd change my mind if 3.1 prefers a single `bad-puzzle` reason.

## Out of scope
- Showing the score as "par", "−1" or "+1": 3.5 (and 4.1 for the share). The score is a plain number here.
- Storing the shortest path on `Game` for the end screen: 3.4 / 3.5
- Picking puzzles and the schedule format: 2.2 / D24
- Showing par before the game: 3.1
- Saving and restoring a game: 3.9
- Hints in the share: 4.2
