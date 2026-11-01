# 2.1 plan

## Approach
`createSeededRandom` keeps a 32-bit state in a closure and steps it with mulberry32. `pickFrom` takes the next fraction in `[0, 1)` and returns `items[Math.floor(fraction × items.length)]`; with `noUncheckedIndexedAccess` that's already `Item | undefined`, and an empty list gives `undefined` without a special case. The file goes in `src/puzzles/`, the home of daily seeding (CLAUDE.md, Project layout). It uses only integer arithmetic (`Math.imul`, `>>>`), so it's pure apart from the generator's own position.

## Files
- `src/puzzles/createSeededRandom.ts` — new
- `tests/puzzles/createSeededRandom.test.ts` — new
- `sdlc/2.1-seeded-random/` — these records

## Tests
| Test | Rule |
|---|---|
| the same seed picks the same sequence | Same date, same puzzle for everyone (D5) |
| seeds one apart pick different sequences | Consecutive dates get different puzzles (2.4 will use nearby seeds) |
| seed 2026 picks the same sequence it always has | Changing the generator would reshuffle every puzzle (D24); see intent, least sure 1 |
| picks every item in a short list and nothing else | Every puzzle word can be chosen, and a pick from a non-empty list is never `undefined`; catches an off-by-one either way |
| picking from an empty list finds nothing | No candidate targets is an expected case in 2.2 ("reports failure") |

The first two compare 20 picks from the alphabet, so a chance match is about 1 in 26²⁰. "Every item" makes 100 picks from 4 items: missing one by chance is about 4 × (3/4)¹⁰⁰, under 1 in 10¹².

## Self-check
- Files: match the list above. One test changed after human review: the empty-list test passes a typed `noWords: string[]` instead of `[]`, because `pickFrom([])` infers `never` and its plain `undefined` result fails `no-confusing-void-expression`. What it checks is unchanged.
- Lint, tests and coverage: pass; 214 tests, coverage 100%.
- Diff against intent: mulberry32 in a closure with `pickFrom` only, seed wrapped with `>>> 0`; nothing from 2.2 or 2.4.
