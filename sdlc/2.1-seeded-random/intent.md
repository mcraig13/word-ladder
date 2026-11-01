# 2.1 Seeded random

**Intent:** a random source that gives the same picks for the same seed, so the daily puzzle is the same for everyone on a date and puzzle generation (2.2) can be tested. Pure code can't use `Math.random` (D21).
**Signature:**
- `createSeededRandom(seed)` → a `SeededRandom` with `pickFrom(items)`, which returns one item from the list, or `undefined` for an empty list. Each call moves the sequence on.
- The seed is a whole number from 0 to 2³² − 1. Seeds outside that range wrap into it (`seed >>> 0`); this is documented, not checked.

## Rules protected
- One daily puzzle, the same for everyone on a given date (CLAUDE.md, The puzzle; D5)
- No randomness without an injected seed (CLAUDE.md, Project layout; D21)

## Acceptance criteria
- the same seed picks the same sequence
- seeds one apart pick different sequences
- seed 2026 picks the same sequence it always has
- picks every item in a short list and nothing else
- picking from an empty list finds nothing

## What I'm least sure of
- **The pinned-sequence test.** Its letters weren't worked out by hand: they come from a separate BigInt version of mulberry32 written only to produce them (seed 1's first value matches the published 0.6270739…). It guards D24: if the generator changes, every puzzle generated from a seed reshuffles. If D24 goes with Option A (a schedule file), that matters less, and the test could go.
- **A generator that keeps state, not pure state passing.** `pickFrom` changes the generator's position, so it isn't a pure function after `createSeededRandom`. The other option is `pickFrom(state, items)` → `{ item, nextState }`, which matches how `Game` is handled but is clumsy in 2.2's loops. A generator lives for one generation run and is never shared, which is why I chose state.
- **Only `pickFrom`.** 2.2 needs to pick a start word and then a target from the candidates, and nothing else. A `[0, 1)` number or a whole number below a limit can be added when a chunk needs one. Picking uses `Math.floor(fraction × length)`, so for lists of thousands of words the bias is around one in a million: not worth fixing.
- **Mulberry32** (32-bit state, about 10 lines, no dependency). Its period of 2³² is plenty for a daily game. Other choices, such as sfc32 or xoshiro128, are stronger and longer.

## Out of scope
- Turning a date into a seed: 2.4
- Picking start and target: 2.2
- Adding `src/puzzles/` to the pure-code lint rule: 1.11 loads files from `src/puzzles/`, so the rule can't cover the whole folder
