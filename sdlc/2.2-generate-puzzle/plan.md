# 2.2 plan

## Approach
1. Start candidates: `puzzleWords.getWordsOfLength(wordLength)` that `acceptedWords.containsWord`. Alphabetical, so the order is stable.
2. `createSeededRandom(seed)`, then pick a start from the candidates.
3. One breadth-first search from the start over the accepted words, recording each word's moves from the start and stopping at `most` (backlog design note). Neighbours come from `getWordsOneLetterAway`, remembered in a `Map` for the length of the call, so a retried start doesn't scan the same words again. See intent, least sure 1.
4. Targets: the other start candidates whose moves are from `fewest` to `most`. The start itself is never a target, and words the search didn't reach have no moves, so they're never targets (unsolvable puzzles can't come out).
5. No targets: drop that start and pick again with the same generator. None left: `{ ok: false, reason: "no-puzzle-in-range" }`.

Options object rather than five positional arguments, so a call reads by name. Types `GeneratePuzzleOptions`, `Puzzle` and `GeneratePuzzleResult` exported from the same file.

## Files
- `src/puzzles/generatePuzzle.ts` — new, about 60 lines
- `tests/puzzles/generatePuzzle.test.ts` — new
- `tests/puzzles/generatePuzzle.scowl.test.ts` — new, the real-list check
- `sdlc/2.2-generate-puzzle/` — these records

## Tests
| Test | Rule |
|---|---|
| start and target are both puzzle words | Start and target come from the puzzle words (D8) |
| never picks a puzzle word that isn't an accepted word | `createGame` rejects a start or target that isn't accepted (1.10); "wold" would reach targets if it slipped through |
| never picks a target closer than the fewest moves | Shortest path inside the range (D16, D27); catches `>` for `>=` |
| never picks a target farther than the most moves | Same, upper bound; catches `<` for `<=`, and the search cut-off one move short |
| measures a target by its shortest path when a longer route also reaches it | The range is in moves of the shortest path (D27); added after review (A1), catches a depth-first search |
| every generated puzzle is solvable | Every puzzle is solvable (D8); a word in another cloud is never paired |
| never picks the start as its own target, even when the range starts at 0 moves | `createGame` rejects the same word (1.10) |
| tries another start when the first one picked has no target in range | A puzzle that exists is found, rather than failing on an unlucky first pick |
| the same seed produces the same puzzle | Same date, same puzzle (D5, D24) |
| picks words of the requested length | Word length is a parameter (D4) |
| reports failure when no puzzle fits the range | Expected failures return a reason (CLAUDE.md, Conventions) |
| reports failure when there are no puzzle words of the requested length | Same; an empty candidate list fails rather than throwing |
| a puzzle from the real word lists has a shortest path in the requested range | The rules hold on the real lists, and one puzzle fits in the 5 s test timeout |

The seed-sweep tests run 100 seeds and compare the set of puzzles seen, as `"first-second"` in alphabetical order, with the hand-worked set. Each allowed puzzle has about a 1 in 10 chance per seed or better, so the full set turning up is all but certain; a wrong puzzle allowed by a break would turn up the same way. The real-list test checks with `findShortestPath`, a separate function, not with literals: which puzzle seed 2026 gives isn't worth pinning, since published puzzles live in the schedule file (D24).

## Self-check
- Files: match the list above; `generatePuzzle.ts` is 109 lines, not 60 (doc comments and a `getMovesFromStart` helper). With the tests, 376 lines in `src/` and `tests/`, over the ~200 guide; the tests were sized at the human stop
- Lint, tests and coverage: pass; 100% coverage; the real-list test runs well inside the timeout
- Diff against intent: one search per start capped at `most`, start and unreached words never targets, retries drop the start; no rule or scope change
