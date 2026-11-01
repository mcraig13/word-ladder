# 2.6c review

Two reviewers in parallel (M chunk, D29), on `8d290de..739a21f`. G1–G5 are the first reviewer's findings, B1–B3 the breaks reviewer's; fixes are in the commit after `739a21f`. **Tests changed after human review:** seven tests added (G1, G5, B1, B2 ×4) and the script test changed (G2, G3); no approved assertion was weakened.

## Everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

1. **should fix** No fixture test shows the shortest path is searched over the accepted words rather than the puzzle words: every test reaching that step uses one list for both. Swapping them went red only on the two real-data tests. — *Response:* fixed: added "searches for the shortest path over the accepted words, not the puzzle words" (puzzle words `cold`, `warm` only).
2. **nit** `tests/scripts/buildSchedule.test.ts` never deletes its temp folder. — *Response:* fixed: removed with `rmSync` after the run.
3. **nit** On failure the script test doesn't show `stderr`, and `spawnSync` has no timeout, so a hung script hangs the run. — *Response:* fixed: `stderr` is in the asserted object (expected `""`) and `spawnSync` gets the 60 s timeout.
4. **nit** Comments still give the 25 s timing from before the speed-up. — *Response:* fixed in both test files. `intent.md` is left as approved; the plan's self-check records the change.
5. **note** Dropping `z` from `ALPHABET` left every `getWordsOneLetterAway` unit test green. — *Response:* fixed: added "finds words changed to the first or last letter of the alphabet" (`dote` → `date`, `doze`).

**Notes:** lint and coverage pass; the new lookup matches the old one on every accepted word; a fresh rebuild matches the committed schedule; script failures print as planned; `@types/node` stays in the one test; files match the plan; tests follow the rules; naming fine; backlog lines answered as proposed.

## Breaks

**Reviewer:** independent agent, fresh context, focus: breaks · **Verdict:** approve with changes

1. **should fix** Dropping the `Math.max(0, …)` clamp on the window start left all tests green: with a negative start, `slice` counts from the end, so repeats in the first `daysBeforeWordRepeats` puzzles go unchecked (#2–#90 in the real build). — *Response:* fixed: added "rejects a word repeated within the window near the start of the schedule".
2. **should fix** Nothing tests how `getExtendedScheduleText` passes options to `checkSchedule`: checking only the file's lines (E2), a window of 0 (E3), accepted words as puzzle words (E4) and today forced to 0 (E5) all stayed green. — *Response:* fixed: four tests added, one per break ("extending checks the new puzzles as well as the file's lines", "…with the repeat window it is given", "…against the puzzle words, not the accepted words", "extending counts the puzzles ahead from today's puzzle number").
3. **note** The script's `fewestPuzzlesAhead = 60` can be 0 with everything green. — *Response:* not changed: the script always extends 365 ahead before checking, so no file makes it fail until today's number comes from the date. Carried forward to 3.8.

**Notes:** lint and 310 tests pass; awkward input (empty schedule, today past the end, `NaN`/`Infinity`) behaves as intended; comparisons are case-sensitive, but only a direct caller can pass capitals.

### Reviewer's own break-the-code checks
47 breaks, all applied.
- Start equals target: guard deleted (B1), moved after the moves check (B3b), flipped (B2) → red
- Puzzle words: start only (B4), target only (B5), accepted words (B6), guard deleted (B7) → red on the matching tests
- Repeat window: one short (B8), one long (B9), starts only (B11), targets only (B12), start only (B13), target only (B14), guard deleted (B15), window includes itself (B16) → red
- **Clamp removed (B10) → all green** (finding 1)
- Solvable and moves: unsolvable passes (B17), `<` / `>` for `!==` (B19, B20), `length` (B21), guard deleted (B22) → red; puzzle words for the search (B18) → red only on the real-data tests (see G1)
- Puzzle number: 0-based (B23), last failure (B24) → red
- Puzzles ahead: `>` (B25), `NaN` passes (B26), off by one (B27), today ignored (B28), guard deleted (B29), early `ok` (B30) → red
- Extending: check deleted (E1), fewest forced to 0 (E6) → red; **E2–E5 → all green** (finding 2)
- Script: path ignored (S1), reads `""` (S2), fewest 400 (S3) → red; **fewest 0 (S4) → green** (finding 3)
- `getWordsOneLetterAway`: includes itself (W1), unsorted (W2), last position skipped (W3), inserts (W4), no `a` (W6) → red; no `z` (W5) → red only on real-data tests (see G5)

### Re-run after the fixes
The breaks reviewer re-ran B10, B18, E2–E5 and W5 on the fixed tests: all seven red, each on the test added for it.
