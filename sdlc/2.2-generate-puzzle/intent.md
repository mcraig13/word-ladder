# 2.2 Generate puzzle

**Intent:** pick a start and target from the puzzle words whose shortest path over the accepted words is inside a requested range, the same for the same seed. 2.6's build script runs it once per date to write the schedule (D24); the browser never runs it.
**Signature:** `generatePuzzle({ acceptedWords, puzzleWords, wordLength, shortestPathMoves: { fewest, most }, seed })` → `{ ok: true, puzzle: { start, target } }` or `{ ok: false, reason: "no-puzzle-in-range" }`. Both word lists are `Dictionary`s, so words come back lowercase and in a stable order. A puzzle is only start and target: `createGame` works out par (2.2 carried forward).

## Rules protected
- Start and target are puzzle words; moves are checked against accepted words; every puzzle is solvable (CLAUDE.md, The puzzle; D8)
- The shortest path is over the accepted words; the range is in moves of the shortest path, not par (D27, D16)
- Same date, same puzzle: the same seed gives the same puzzle (D5, D24)
- Word length is a parameter (D4)
- Start and target differ: `createGame` rejects the same word (1.10)

## Acceptance criteria
- start and target are both puzzle words
- never picks a puzzle word that isn't an accepted word
- never picks a target closer than the fewest moves
- never picks a target farther than the most moves
- every generated puzzle is solvable
- never picks the start as its own target, even when the range starts at 0 moves
- tries another start when the first one picked has no target in range
- the same seed produces the same puzzle
- picks words of the requested length
- reports failure when no puzzle fits the range
- reports failure when there are no puzzle words of the requested length
- a puzzle from the real word lists has a shortest path in the requested range

## What I'm least sure of
- **Speed of reusing `getWordsOneLetterAway`.** The search uses the core function, so "one letter apart" has one definition (human's choice at the stop). It scans every word each time, so a call takes about 200 ms on the real lists (1.9 review 5), and a year of schedule about a minute, by estimate. Neighbours are remembered within a call, so retrying starts costs little more. If 2.6 finds the build too slow, it can pass in a faster lookup then; a pattern lookup (`c_ld`) was the other option, at the cost of a second definition.
- **A seed, not a `SeededRandom`.** Taking a number keeps `generatePuzzle` pure (a `SeededRandom` changes as it picks) and matches the backlog. The seed isn't checked: `NaN` or `1.9` act as seeds 0 and 1. Turning dates into valid seeds is 2.6's carried-forward item; checking here instead would need a second failure reason.
- **Retrying starts.** A start with no target in range is dropped and another picked, until none are left. So the failure case runs one search per puzzle word; with neighbours remembered, only the first is slow. Picking the start and target as a pair would need every pair's distance first, which is the cost the design note avoids.

## Out of scope
- Turning a date into a seed, writing and checking the schedule, not repeating words across dates: 2.6
- The agreed par range: 2.3 (D16)
- Checking the range itself (e.g. `fewest > most` simply finds no puzzle)
