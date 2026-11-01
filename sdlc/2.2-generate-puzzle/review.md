# 2.2 review

Two reviewers in parallel (M chunk, D29): A everything except breaks, B breaks.

## Review A: everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** None of the small fixtures has two routes of different lengths between the same words, so no test checks that a word's moves are its *fewest* moves. `LADDER` is a straight line, and on a line any search that doesn't revisit words gets the distances right. Making `getMovesFromStart` depth-first (pop instead of iterate) kept every test green. On the real lists that version gives puzzles below the range: for a 4–6 range, seeds 0–9 gave `rile-bate`, `mams-aims` and `cool-pots`, each 3 moves by `findShortestPath`. Protects D16/D27. Fix: a fixture with a loop. — *Response:* fixed. **Test added after human review:** `measures a target by its shortest path when a longer route also reaches it`, with `bold`, `bald` and `bard` making a loop from `cold` to `card` and `ward`. Depth-first from `bald` reaches `card` at 4 via `cold` and `cord`, so the break puts `bald-card` in a 3–4 range. The re-run of this break is below.
2. **note** The intent's time estimate is low: 50 seeds at 4–6 took 18.3 s, about 370 ms a call, so a year is about 2¼ minutes. The memo lasts one call. A failing range took 2.1 s. — *Response:* not changed here; carried forward to 2.6 in `backlog.md`, with review B's 180 ms figure, since the two machines differ.
3. **note** 5.1 Practice mode depends on 2.2 and generates a puzzle on demand, which runs it in the browser, against the intent's "the browser never runs it". — *Response:* carried forward to 5.1 in `backlog.md`. The intent is right for 2.2's own use (D24); 5.1 decides then.
4. **note** 376 lines in `src/` and `tests/` against the ~200 guide; no split was proposed. — *Response:* not split: source is 109 lines and the tests were sized and approved at the human stop. Called out in the PR description.
5. **nit** In `the same seed produces the same puzzle`, "Ten possible puzzles, counting direction" is wrong: 10 pairs, 20 puzzles. The test also calls the unit in Arrange. — *Response:* comment fixed (test comment only, after human review). The call in Arrange is the first run the second is compared with; left as is.
6. **nit** In the real-list test, a failed result falls back to empty words and fails with an unclear message. — *Response:* fixed: `expect(result.ok).toBe(true)` first (assertion added after human review).

**Notes:** files match the plan · every acceptance criterion has a test with that name · hand-worked expected sets checked · naming fine · awkward input (`wordLength` 0, −1, 4.5, empty lists, `most` 0, `fewest > most`, NaN bounds, NaN seed) behaves as the intent says · seeds 0–49 on the real lists gave 50 puzzles all in range and accepted by `createGame` · lint and puzzle tests pass.

### Reviewer's own break-the-code checks
- Out of focus; only the depth-first search above, which stayed green.

## Review B: breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve

### Findings
1. **note** The upper bound is enforced twice: the search stops at `most`, and the target filter checks `<= most`. Either alone keeps every test green (B7, B9, B10); both together go red, so the rule is protected. Nothing tests the cut-off itself, the design note's cost control: deleting it costs time, not correctness. — *Response:* not changed; a correctness test can't see it. Carried forward to 2.6, whose build time would show it.
2. **note** Not dropping a failed start (B19, B20) or retrying without removing it (B24) loops forever on the failure case; the only signal is a hung run. Red as the checklist expects. — *Response:* not changed. The loop is synchronous, so Vitest's timeout can't stop it; a guard on iterations would be code only a break needs.

**Notes:** lint passes; 241/241 before breaks · mixed-case and padded words come back lowercase · bad ranges, lengths and NaN return `no-puzzle-in-range` · `fewest: 3.5` acts as 4 · 30 real-list seeds took 5.4 s, about 180 ms each.

### Reviewer's own break-the-code checks
All in `src/puzzles/generatePuzzle.ts`, timeout 40 s per run.
- Red as expected: delete accepted-word filter (B1); targets from all accepted words (B2); `>=`→`>` on fewest (B4); `<=`→`<` on most (B5); delete fewest check (B6); cut-off one short (B8); delete `word !== start` (B11); forget visited words (B13); `+1`→`+2` (B15); seed fixed at 0 (B16); `Math.random` (B17); no retry (B18); hard-coded length 4 (B21); search from first candidate (B22); fall back to any target (B23); cut-off at fewest (B25); B7+B9, B7+B10
- Red by timeout (finding 2): B19, B20, B24
- All green, behaves the same as the original: targets from unfiltered puzzle words (B3, unaccepted words are never reached); delete `moves !== undefined` (B12, comparisons with undefined are false); start not marked visited (B14)
- All green, covered by the other bound check (finding 1): B7, B9, B10

## Re-run of breaks after the fixes

Breaks-only reviewer, fresh context, on d88e223 · **Verdict:** the fix works.

- Depth-first search (R1) → red: only `measures a target by its shortest path when a longer route also reaches it`, so the new test closes A1
- Moves overwritten when a word is reached again (R2), most moves kept (R3), visited words forgotten (R4) → red: closer than fewest; measures by shortest path; tries another start; reports failure when no puzzle fits
- Moves recorded from the queue's last entry (R6) → red: closer than fewest; measures by shortest path
- New fixture's expected value checked by hand; the comment fix and the added `result.ok` assertion weaken nothing

1. **note** Re-exploring a word when a shorter route turns up stays green, as it should: it still finds the fewest moves. — *Response:* no change needed.
