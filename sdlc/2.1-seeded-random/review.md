# 2.1 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve

The change is small and correct, and it stays within scope. It touches only the four files the plan lists: `src/puzzles/createSeededRandom.ts`, `tests/puzzles/createSeededRandom.test.ts` and the two records. Every acceptance criterion has a test, and every break I tried turned at least one test red.

## Findings
1. **note** Seeds that aren't whole numbers fall back to seed 0 without any warning. I ran this: `NaN`, `Infinity`, `-Infinity` and `2**53` all give the same sequence as seed 0 (`gafdmopqlp`), and `1.9` gives the same as `1`. The intent documents this ("documented, not checked"), so it isn't a problem for 2.1. It matters for 2.4, though. If an invalid date turns into a `NaN` seed, the player gets the seed-0 puzzle instead of an error. This should go on 2.4's backlog entry as a *Carried forward* line: 2.4 should make sure a date always becomes a whole number from 0 to 2³² − 1. — *Response:* not changed in 2.1, as the intent says. Carried forward to 2.4's backlog entry in the backlog update after merge, the same way 6.1b's notes were carried forward.
2. **note** The pinned sequence `lirqdfruhb` for seed 2026 is not written out by hand, as the intent says. I checked it separately against the widely published mulberry32 (the `a |= 0; a = a + 0x6D2B79F5 | 0; …` form) and got the same `lirqdfruhb`. Seed 1's first value also matched, 0.6270739405881613. This makes the test stronger than "least sure 1" suggests: it pins the standard algorithm, not only this code's own output. Breaks 1, 2, 10, 12 and 13 below show it is the only test that catches a change to the generator. That supports keeping it whichever way D24 goes, unless puzzles stop being generated from seeds. — *Response:* not changed: the test stays. The PR's least-sure list is updated to say a second, independent check agrees with the pinned sequence.

**Notes:**
- `npm run lint` passes (tsc, ESLint, Prettier). I ran the tests with coverage in a scratch copy: 214 tests pass and coverage is 100% on all four measures.
- Tests follow AAA with one Act each and are named after behaviour. In the first two tests the second generator's picks are made in Arrange, which is fine: the Act is the call being compared.
- Awkward input I ran: a one-item list always returns that item. Seeds −1 and 2³² − 1 give the same sequence, and so do 2³² and 0, which is the documented wrapping. 260,000 picks from 26 letters gave between 9,806 and 10,220 per letter, so there is no visible bias. Consecutive date-like seeds (20261101 onward) give varied first picks.
- Naming is fine: `createSeededRandom`, `pickFrom`, `getNextFraction`, `state` and `mixed` read clearly. There are no abbreviations or single-letter names.
- `seed >>> 0` versus `seed | 0` makes no difference: the `>>> 0` after the add gives the same state either way. So it isn't a meaningful break, and I didn't run it.
- The records are within the size limits: intent is 28 lines, plan is 25. The self-check calls out the test that changed after human review.

## Reviewer's own break-the-code checks
I ran 14 breaks with `scripts/break.mjs` in a scratch copy. All were applied, and none left every test green.
- Changes to the generator in place: the shift `>>> 15` changed to `>>> 16`, the constant `| 61` changed to `| 60`, and the seed changed to `seed + 1` → red: seed 2026 pinned
- Off-by-one in picking: `Math.floor` changed to `Math.round`, `Math.floor` changed to `Math.ceil`, `items.length - 1`, and dividing by 2³¹ instead of 2³² → red: pinned, every item in a short list
- Reorder: mixing before stepping the state → red: pinned
- Two steps per pick → red: pinned
- Forget state (the next state is worked out but not stored) → red: seeds one apart, pinned, every item
- State shared between generators (moved to module level) → red: same seed same sequence, pinned
- Wrong input (the seed is ignored, state starts at 0) → red: seeds one apart, pinned
- Always returns the first item → red: seeds one apart, pinned, every item
- Empty list returns `null` instead of `undefined` → red: picking from an empty list finds nothing
- Delete a guard / return early: not applicable, because the code has no guards or shortcut results.
