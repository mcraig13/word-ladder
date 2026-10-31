# 1.9 plan

## Approach
- Normalise both words with `normaliseWord`. Then check, in order: `invalid-word`, `different-lengths`, and `not-a-word` (either word missing from `dictionary.containsWord`).
- Breadth-first search from the start word. The queue holds `{ word, path }` entries, where `path` is a `Chain` ending at `word`. A set holds every word already reached. Neighbours come from `getWordsOneLetterAway`, in alphabetical order. A word is queued only the first time it's reached, so the first path to it is kept. That's the alphabetically first shortest path (intent choice 4).
- When the word taken off the queue is the target, return its path. Start equals target is the first entry, `[start]`, so it needs no special case. If the queue runs out, return `unreachable`.
- Paths are built as `[...path, nextWord]`, which is still a `Chain` (as in `applyMove`). Keeping whole paths, not a map from each word back to the one before it, means there's no `map.get(...) ?? …` fallback that can never run, which 100% branch coverage would fail on. The memory cost is a few thousand short arrays.
- Backlog: replace 1.9's *Carried forward* line with "Done in 1.9: reuses `getWordsOneLetterAway`; speed re-checked in 6.1". Add to 6.1: *Carried forward: time `findShortestPath` on the built accepted list (worst case: a target it can't reach) and record it; 1.9 estimated about 80 ms on a PC from a synthetic list. If it's too slow for 2.2, speed up `getWordsOneLetterAway` behind its 1.4 tests (1.9 intent choice 3).*

## Files
- `src/core/findShortestPath.ts`: new, 60 lines
- `tests/core/findShortestPath.test.ts`: new, 17 tests, 222 lines (282 with the source; over the ~200 guide, see intent choice 6 and review 6)
- `backlog.md`: 1.9 and 6.1 *Carried forward* lines
- `sdlc/1.9-find-shortest-path/`: these records

## Tests
Fixtures are real 4-letter words, worked by hand. "Moves" counts words after the start.

| Test | Input | Expected | Rule |
|---|---|---|---|
| finds a path whose length is the fewest moves between two words | `cold → warm`; a 5-move route via `bold` (first alphabetically) and a 4-move route via `cord` | `cold, cord, card, ward, warm` | Par is a shortest path (D9) |
| every step of the path is one letter apart and in the dictionary | `cold → warm`, three routes | each step passes `areWordsOneLetterApart` and `containsWord`; the path has more than one word | Moves (CLAUDE.md) |
| path starts at the start word and ends at the target | same fixture | first `cold`, last `warm` | Chain begins at start (1.6); win at target |
| does not take a shortcut that changes two letters | `cold → card`, with `cord` | `cold, cord, card` | One letter per move |
| does not take a shortcut that moves letters | `cold → load`, with `cord, lord` | `cold, cord, lord, load` | Same position |
| does not step through a word that is not in the dictionary | `cold → bolt`, `colt` listed, `bold` not | `cold, colt, bolt` | Accepted words only |
| returns the alphabetically first shortest path when there are several | `cold → bolt` via `bold` or `colt`, `colt` listed first | `cold, bold, bolt` | Same path for everyone (D6) |
| returns a single-word path when start equals target | `cold → cold` | `cold` | Backlog 1.9 |
| ignores the case of the start and target and returns the path in lowercase | `COLD → Card` | `cold, cord, card` | Case-insensitive (CLAUDE.md) |
| ignores spaces around the start and target *(added with the tests)* | `" cold" → "card "` | `cold, cord, card` | Input normalised (1.1) |
| returns no path, with reason unreachable, when the target is unreachable | `cold → warm`; `cord` and `card` reachable, a loop *(loop added after review 4)* | `unreachable` | Backlog 1.9 |
| returns no path, with reason different-lengths, for words of different lengths | `cold → colds`, `colds` not listed *(after review 1)* | `different-lengths`, not `not-a-word` | Same length (CLAUDE.md) |
| returns no path, with reason not-a-word, when the start is not in the dictionary | `colt → cord`; `colt` is one letter from `cold` | `not-a-word`, not `colt, cold, cord` | Accepted words only |
| returns no path, with reason not-a-word, when the target is not in the dictionary | `cold → card`, `card` not listed | `not-a-word`, not `unreachable` | Intent choice 1 |
| returns no path, with reason invalid-word, when given something that is not a word | `co1d → cord` | `invalid-word` | Result with a reason (Conventions) |
| returns no path, with reason not-a-word, when start equals target but is not a word *(after review 3)* | `colt → colt`, only `cold` listed | `not-a-word` | Accepted words only |
| returns no path, with reason invalid-word, when the target is empty *(after review 2)* | `cold → ""` | `invalid-word` | Empty input (CLAUDE.md) |

Notes for review:
- **Added with the tests:** "ignores spaces…". `normaliseWord` trims, but an implementation that only lowercased would pass the case test and still search from `" cold"`.
- **The step invariant uses `areWordsOneLetterApart` and `containsWord`** in its assertion. That's the property check CLAUDE.md encourages for a solver, not a copy of the solver's logic. The exact-path tests above it carry the hand-worked values.
- **"does not step through a word not in the dictionary"** can't go red through a small break of today's code, because `getWordsOneLetterAway` only returns listed words. It protects against a future faster lookup that generates candidates and skips the dictionary check. Self-review will run that as a break.
- **The order the reasons are checked in** is tested where it shows: length before the dictionary (added after review 1).

## Self-review
The diff matches the intent and touches only the files listed. Lint passes. 102 tests pass, with 100% on all four coverage measures (60/60 branches). Every break was restored.

**Test strengthened after your review:** "finds a path whose length is the fewest moves…". A depth-first break, with the queue turned into a stack, turned only the alphabetical-order test red. The stack tried `cord` first and happened to find the short route. The fixture now has a longer route on each side of `cord` alphabetically (via `bold`, and via `hold, held, herd, hard`), so depth-first search in either order goes red. The expected path is unchanged.

Behaviour breaks (`npm run break`):
- Depth-first: the queue becomes a stack → red: "fewest moves" *(after strengthening)*, "alphabetically first"
- Depth-first in alphabetical order (stack plus reversed neighbours, two edits, run by hand) → red: "fewest moves"
- Neighbours in reverse alphabetical order → red: "alphabetically first"
- Lookup accepts any same-length word → red: both shortcut tests, "fewest moves", the step invariant, and 9 more (including 1.4's)
- Lookup also matches by sorted letters, ignoring position → red: "does not take a shortcut that moves letters", and 1.4's `load` test
- Faster lookup that tries every letter in every position but skips the dictionary → red: "does not step through a word not in the dictionary", the step invariant, and 6 more
- Start not checked against the dictionary → red: "not-a-word… start"
- Target not checked → red: "not-a-word… target"
- Different lengths not checked → red: "different-lengths"
- Start not normalised → red: the case and spaces tests
- Start lowercased but not trimmed → red: only "ignores spaces…" (the test added with the tests)
- Start equal to target not counted as found → red: "single-word path"
- Path leaves out the start word → red: 9 tests, including "starts at the start word…"
- Invalid start not checked → red: "invalid-word"

Type break (`tsc --noEmit`, by hand):
- Search starts from `path: []` → error: `[]` is not assignable to `Chain`

## Stryker trial
Run once, after the self-review breaks. Results were kept out of this file until the independent review was in.
- **Setup:** a scratch copy of the repo, with `npm install --no-save @stryker-mutator/core@10.1.1 @stryker-mutator/vitest-runner@10.1.1` (Vitest 5.0.5 worked with the Vitest runner). Config: `mutate: ["src/core/findShortestPath.ts"]`, `coverageAnalysis: "perTest"`, and a Vitest config that includes only `tests/core/findShortestPath.test.ts`. Run with `npx stryker run`, which took 3 s. Nothing was committed.
- **First run (tests as reviewed): 48 mutants, 45 killed, 1 timeout, 2 survived. Score 95.8%.**
  - Survived: `reachedWords.add(nextWord)` deleted. Words are queued again, and with a loop in the words an unreachable target never finishes. The `unreachable` fixture had no loop. **A real gap: the reviewer's finding 4.**
  - Survived: `new Set([startWord])` → `new Set([])`. The start can be queued again from a neighbour, but only behind paths that are already shorter, so no result changes. **Equivalent mutant**: it only costs a little extra work.
  - Timeout (counts as caught): the "already reached" check replaced with `true`, an endless loop.
- **After the review fixes: 48 mutants, 45 killed, 2 timeouts, 1 survived (the equivalent one). Score 97.9%.**
- **Compared with the other checks:** Stryker found one gap the hand-made breaks missed, the missing loop. The independent reviewer found it too. Stryker found nothing the reviewer missed. The reviewer found three gaps Stryker didn't: the order of reasons, an invalid target, and start equals target when it isn't a word. Those need a reordered or added statement, which Stryker's operators don't produce.
