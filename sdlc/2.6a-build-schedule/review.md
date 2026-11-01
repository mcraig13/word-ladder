# 2.6a review

Two reviewers in parallel (M chunk, D29): A everything except breaks, B breaks. Diff reviewed: `e668cfd..6de2ae8`; responses in `d4d7523`.

## Review A: everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** D30 and the intent ("least sure" 3) say a hand edit to a published date could bring back words within the window "unless 2.6b checks for it", but 2.6b's backlog entry doesn't carry it. — *Response:* fixed: *Carried forward* line on 2.6b.
2. **note** The existing schedule's words go into the repeat window as given, not lowercased: `CORD/CARD`, `WARD/CORD` with a window of 2 let `cord-warm` through. The file is lowercase today; 2.6b reads it back and a hand edit could add capitals. — *Response:* carried forward to 2.6b (lowercase or reject on read, test mixed case). Not changed here: 2.6a only ever gets schedules it built itself.
3. **note** The script's comment says changing the seed "reshuffles every unpublished date", but with `scheduleSeed + puzzleNumber` a seed one higher shifts the dates by a day (window 0 on the ladder: the whole schedule shifted; real lists: 4 of 20 matched). — *Response:* fixed: the comment says so and to change the seed by more than the puzzles in the schedule.
4. **note** 520 lines in `src/`, `scripts/` and `tests/` against the ~200 guide (142 without tests). — *Response:* called out in the PR description; the tests were approved at the human stop.
5. **nit** `shortestPath` holds a generation failure too; `listDifferent` in the tests reads oddly. — *Response:* renamed to `shortestPathOrFailure`. `listDifferent` left as is: it's in the tests approved at the stop and reads as "list the different ones".
6. **nit** The `createSeededRandom` carried-forward line on 2.6b is out of date: dates no longer seed anything; what's left is that `scheduleSeed` isn't checked. — *Response:* fixed: line reworded.

**Notes:** files match the plan · all 16 criteria have a test · lint and 49 puzzle tests pass · a fresh build in a scratch copy (72 s) is byte-identical to the committed `schedule.txt` · 365 lines, moves 112/132/121 at 4/5/6, 730 different starts and targets, all puzzle words · last puzzle number 0, −3, NaN give the schedule unchanged; window −1 or NaN acts as 0, 1.5 as 1; bad ranges and lengths fail at #1; the input is never changed in place · window 0 is covered indirectly by `adds puzzles after the existing ones` · CLAUDE.md edits follow the 6.1b precedent for `build:words` · no fresh-build test for `schedule.txt`, which fits a one-minute build.

### Reviewer's own break-the-code checks
- Out of focus.

## Review B: breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** Every fixture passes the same list as accepted and puzzle words, so generating over the puzzle words (B28) or running the cross-check over them (B29) left every test green. — *Response:* fixed. **Test added after human review:** `measures each puzzle's shortest path over the accepted words, not the puzzle words` (the reviewer's fixture: puzzle words `cold, card, warm`, range 2–2, expects `card-cold 2`, `card-warm 2`). Re-run below.
2. **should fix** In `reports the puzzle number that has no puzzle in range` the failing number is also `schedule.length + 1`, so reporting that (B30) stayed green. — *Response:* fixed. **Test added after human review:** `reports the puzzle number that has no puzzle partway through a run` (the reviewer's fixture: window 2 runs LADDER out of words at #3). Re-run below.
3. **note** Changing the per-puzzle seed formula (B3, `+ 1`) leaves every test green; no test ties a seed to a puzzle, since that can't be worked out by hand. — *Response:* not changed; carried forward to 2.6b, whose published-dates check should compare start and target as well as moves.
4. **note** Existing words aren't lowercased before the window (`COLD WARM`, window 1, then `cold warm`); a negative window holds back every puzzle but the first. — *Response:* lowercasing carried forward to 2.6b, as A2. The negative-window half didn't reproduce (the guard is `> 0`, so −1 acts as 0, as review A found); the reviewer withdrew it on the re-run.

**Notes:** lint clean, 258 tests pass · committed `schedule.txt` checked as in review A · `lastPuzzleNumber` 0 or negative leaves the schedule unchanged; bad ranges and lengths fail at #1; negative, fractional and maximum seeds are deterministic · the `!shortestPathOrFailure.ok` half of the failure check can't be reached at runtime but narrows the type.

### Reviewer's own break-the-code checks
- Seed: from the position in the run (B1), one seed for all (B2), random noise (B4), ignoring `scheduleSeed` (B5) → red. Off by one, `+ 1` (B3) → **all green** (finding 3).
- Published dates: start from `[]` (B6); loop from 1, one early, one late, `<` for `<=` (B7–B10); cut to `lastPuzzleNumber` (B11) → red.
- Range and length: drop `fewest` or `most` (B12, B13); hard-code 4 in either place (B14, B15) → red. Generation over the puzzle words (B28) → **all green** (finding 1).
- Stored moves: path length, `most` (B16, B17) → red. Cross-check over the puzzle words (B29) → **all green** (finding 1).
- Repeat window: one too long or short (B18, B19); delete the window-0 guard (B20); only existing or only new puzzles (B21, B22); filter removed or inverted (B23, B24); starts or targets only (B25, B26); window also removes path words (B27) → red.
- Failure result: `puzzleNumber - 1` (B31), `continue` (B32) → red. `schedule.length + 1` (B30) → **all green** (finding 2).
- File format: swapped, no final newline, moves dropped, reversed, CRLF (B33–B37) → red.
- **Re-run on `d4d7523`:** B28 and B29 → red (`measures each puzzle's shortest path over the accepted words, not the puzzle words`); B30 → red (`reports the puzzle number that has no puzzle partway through a run`).

## Changes at human review (PR)

- **Seed hashed** (the human reviewer, following review A3 and B3): puzzle #N's seed is `mixBits(mixBits(scheduleSeed) ^ N)`, where `mixBits` is MurmurHash3's 32-bit finaliser with its two multipliers named. Every step can be undone, so within a schedule each number gets a different seed, and a seed one higher no longer gives the same puzzles a day later. **Test added after human review:** `a schedule seed one higher doesn't put the same puzzles on neighbouring dates` (renamed and widened after review C).
- **Window cut from 365 to 90 days** (D30 updated). The rebuilt schedule has 674 different starts and targets, the nearest repeat is 94 days apart, and all moves are 4–6 (97 / 159 / 109).
- Storing the moves (intent, least sure 1) kept as it is.

## Review C: the changes at human review (`8a0979c`)

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** Dropping the inner mix (`mixBits(scheduleSeed ^ puzzleNumber)`) left every test green, yet seed 2027's puzzles then sit on seed 2026's swapped neighbouring dates (28 of 30). The new test caught only the one-day shift. — *Response:* fixed in `23d60fa`: the test (renamed `a schedule seed one higher doesn't put the same puzzles on neighbouring dates`) counts puzzles matching either neighbour and expects fewer than half; chance gives about 3 of 30, either fault nearly all. Re-run below.
2. **should fix** The 2.6b *Carried forward* line still described the seed as `(scheduleSeed + N) >>> 0`. — *Response:* fixed: it names `getPuzzleSeed`.
3. **nit** `mixBits`'s shifts had no comment, unlike the multipliers. — *Response:* fixed: the doc comment says they're fmix32's.
4. **nit** If the first build failed, the test's comparison would pass on `[]`. — *Response:* fixed: both schedules' lengths are checked.

**Notes:** the commit matches this file's "Changes at human review" section · records say 90 days and a hashed seed · each puzzle number gets its own seed (every step can be undone) · a fresh build matches the committed `schedule.txt`; nearest repeat 94 puzzles apart · lint clean, 261 tests pass · on the unbroken code the neighbour count is 2, 0, 4 and 2 for four seed pairs, well under 15.

### Reviewer's own break-the-code checks
- Back to the sum (S1), `mixBits(scheduleSeed + puzzleNumber)` (S11) → red. Ignore `scheduleSeed` (S4), ignore `puzzleNumber` (S5), seed from the position in the run (S13) → red.
- Drop the inner mix (S3) → **all green** (finding 1).
- Drop the outer mix, xor to add, a shift or multiplier changed, `puzzleNumber - 1` (S2, S6–S10, S12) → all green; these only reshuffle, which the constants' comment already says. No finding.
- **Re-run on `23d60fa`:** S1, S3 and S11 → red (`a schedule seed one higher doesn't put the same puzzles on neighbouring dates`).
