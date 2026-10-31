# 1.9 findShortestPath

**Intent:** find one shortest path from a start word to a target, so the game can work out par (1.10), check that a puzzle is solvable (2.2), show a shortest path at the end (3.4, 3.5) and give hints (4.2). Breadth-first search over the accepted words.
**Signature:** `findShortestPath(start, target, dictionary)` → `FindShortestPathResult`:
- `{ ok: true, path }`: `path` is a `Chain`, lowercase, from `start` to `target`. Par is `path.length - 1` (1.10).
- `{ ok: false, reason }`, where reason is:
  - `invalid-word`: start or target isn't letters a–z after trimming (as `normaliseWord`)
  - `different-lengths`: start and target have different lengths
  - `not-a-word`: start or target isn't in the dictionary
  - `unreachable`: both are words, but no chain of moves joins them

Reasons are checked in that order, so the first one that applies is returned.

## Rules protected
- A move changes exactly one letter, in the same position (CLAUDE.md, Moves; 1.4 *Carried forward*)
- Every word in the chain must be an accepted word (CLAUDE.md, Moves)
- Par is the number of moves in a shortest path over the accepted words; `cold → cord → card → ward → warm` is par 4 (D9)
- The same inputs always give the same path, so every player sees the same par and the same end-screen path (D6, D9)
- Case is ignored; words are stored lowercase (CLAUDE.md, Moves)
- An expected failure returns a reason rather than throwing (CLAUDE.md, Conventions)

## Acceptance criteria
- finds a path whose length is the fewest moves between two words
- every step of the path is one letter apart and in the dictionary
- path starts at the start word and ends at the target
- does not take a shortcut that changes two letters
- does not take a shortcut that moves letters
- does not step through a word that is not in the dictionary
- returns the alphabetically first shortest path when there are several
- returns a single-word path when start equals target
- ignores the case of the start and target and returns the path in lowercase
- returns no path, with reason `unreachable`, when the target is unreachable
- returns no path, with reason `different-lengths`, for words of different lengths
- returns no path, with reason `not-a-word`, when the start is not in the dictionary
- returns no path, with reason `not-a-word`, when the target is not in the dictionary
- returns no path, with reason `invalid-word`, when given something that is not a word

The two shortcut tests are 1.4's move-rule tests, written against the solver.

## Choices for you (beyond the backlog entry)
1. **Return value: a result object with a reason when there's no path.** Recommended.
   - CLAUDE.md's naming rule says `find…` "searches and may find nothing". The result object is how this function says it found nothing, and why. It keeps the `find…` name: `check…` is for judging a value you already have, and there's no candidate path to judge here.
   - The reasons matter to callers: an `unreachable` result from 2.2 is a normal outcome to skip past, while `not-a-word` or `invalid-word` means a bug or bad data.
   - Alternative: return `Chain | undefined`, as `Array.find` does. It's simpler, but every kind of failure looks the same, and CLAUDE.md asks for a reason when a function can fail in expected ways.
   - Smaller alternative: one reason, `no-path`, for everything. That's fewer branches, but a typo in puzzle data would look like an unreachable target.
2. **The path is a `Chain` (imported from `createGame.ts`).** Recommended.
   - A path always has its start word, so it's non-empty for the same reason a game's chain is. 1.10 can take `path.length - 1` without checking for an empty path.
   - The end screen shows it beside the player's `Game.chain`, so both are the same type.
   - 4.2 needs `path[1]` (the hint), and that's typed `string | undefined` either way, so no help is lost.
   - It's built as `[startWord, ...laterWords]`, as `undoLastMove` does, with no cast.
   - Alternative: `readonly string[]`. This looks more general but loses the guarantee for nothing. Another alternative: a separate `Path` type with the same shape; the name is clearer, but it's a second type that means the same thing.
3. **Reuse `getWordsOneLetterAway`; no faster lookup in this chunk.** Recommended.
   - **Speed evidence**, from a scratch prototype using copies of the current logic on a synthetic list (all 4-letter strings over 8 letters, 4,096 "words"; no real word data). One full search, the worst case where every word is visited, takes about **120 ms** on this PC. Trying every letter in every position and checking the dictionary takes about 30 ms. The cost of reusing is about N² comparisons, so about 3,300 real words should take roughly 80 ms, and a phone maybe 3–5× that.
   - That's fine for one solve when a game loads, and for a hint. Whether 2.2 needs something faster depends on how many solves puzzle generation does, which isn't known yet. 2.2 may need distances from one word to every word, which is a different function anyway.
   - **If a faster lookup is added later**, it goes inside `getWordsOneLetterAway`, with the same signature and alphabetical order. Then 1.4's tests run against it unchanged, including the two move-rule tests (`card`, `load`). The solver's two shortcut tests also check it through the solver.
   - **How speed is checked without real data:** a one-off benchmark script in a scratch folder, on the synthetic list above, with the result recorded in `plan.md`. It isn't committed and isn't a CI test, because timing tests are flaky on shared runners. 6.1 re-measures on the real accepted list. I'll put that on 6.1's entry as a *Carried forward* line, and replace 1.9's line with a pointer to it.
   - Alternative: write the faster lookup now. That changes merged 1.4 code for a speed gain nobody needs yet, and it adds lines to a chunk that's already near the size limit.
4. **Which shortest path: the alphabetically first, compared word by word from the start. The result is always the same.**
   - BFS visits neighbours in the alphabetical order `getWordsOneLetterAway` already gives, and keeps the first route found to each word. That gives the alphabetically first shortest path with no extra code: for `cold → bolt`, the two routes are via `bold` and via `colt`, so the result is `cold → bold → bolt`.
   - **Does it matter?** Par is the same for every shortest path. It does matter that the result is the same every time: everyone sees the same end-screen path (D6), and a hint (4.2: `findShortestPath(currentWord, target).path[1]`) mustn't change when the page reloads. Which path is picked doesn't change any rule.
   - The test lists the words in an order where taking them as listed would give the other path, so it would go red if the order depended on input order.
   - Not chosen: picking the path that shares most words with the player's chain, for the end screen. That's a UI choice for 3.5 or 4.2 if wanted.
5. **Edge cases:**
   - **Start equals target:** `[start]` (0 moves), if it's a valid word in the dictionary; otherwise its reason. `createGame` already rejects `same-word`, so a game never asks for this, but 4.2 may: a hint from the target. It's in the backlog.
   - **Different lengths:** `different-lengths`, checked before the search (the search couldn't find a path anyway). Same reason name as `createGame`.
   - **Mixed case and spaces:** both words go through `normaliseWord`, so `" COLD"` works and the path is lowercase.
   - **Start not in the dictionary:** `not-a-word`. This check is needed: `getWordsOneLetterAway` doesn't check the word it's given (1.4 out of scope), so without it `colt → cold` would come back as a path through a word that isn't accepted.
   - **Target not in the dictionary:** `not-a-word`. Without the check the search would still fail and return `unreachable`, which is true but sends 2.2 the wrong signal (see 1).
   - **Invalid input** (`""`, `"co1d"`): `invalid-word`, same name as `createGame`.
6. **Size:** I estimate about 45 lines of source and about 170 lines of tests (14 tests). That's a little over the ~200-line guide. I'd keep it as one chunk, since it's one function and splitting its tests makes no sense. If you'd rather stay under 200, I'd drop choice 1's separate `not-a-word` reason for the target (it would return `unreachable`, as above), and fold the shortcut tests into one fixture.

## Stryker trial (proposal; nothing installed yet)
- **How: a one-off in a scratch copy of the repo, with nothing committed.** Copy the repo to the scratch folder, then run `npm install --no-save @stryker-mutator/core @stryker-mutator/vitest-runner` there, with a config file in that copy. The repo's `package.json`, lockfile and config don't change, so no new dependency enters this chunk. Process changes stay off this branch.
  - If the Vitest runner doesn't support Vitest 5 yet, fall back to Stryker's command runner (`npx vitest run tests/core/findShortestPath.test.ts`). It's slower but works with any version.
  - Exact versions and the command go in `plan.md`, so the run can be repeated.
- **Scope:** `mutate: src/core/findShortestPath.ts`, and only `tests/core/findShortestPath.test.ts` runs.
- **When:** after the self-review breaks. To keep the comparison fair, the results stay in the scratch folder until the independent reviewer has replied. Otherwise the reviewer would see them in `plan.md`. Then:
  - The mutation score and each surviving mutant, with what it means, go into `plan.md`.
  - Any test fixed because of a surviving mutant is answered in `review.md` beside the reviewer's findings, and called out as changed after review.
  - I report what Stryker found that neither the hand-made breaks nor the reviewer did.
- **If we keep it:** a separate process branch adds the dev dependencies (with the reason in the PR), a config file, an npm script, a DECISIONS entry and a line in `sdlc/README.md`.
- Alternative: commit the config and dev dependencies in this chunk. That adds a dependency before the trial shows it's worth it, and puts a process change inside a code chunk.

## Out of scope
- `getPar` and `getScore`: 1.10
- Distances from one word to every word, for picking puzzles in a par range: 2.2
- A faster `getWordsOneLetterAway`: only if 2.2 or 6.1's measurement needs it
- Picking which shortest path to show beside the player's chain: 3.5 / 4.2
- Keeping Stryker: a process branch, after this trial
