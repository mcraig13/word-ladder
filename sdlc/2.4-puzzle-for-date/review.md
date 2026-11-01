# 2.4 review

**Reviewer:** independent agent, fresh context · **Verdict:** changes needed

## Findings
1. **blocker** The implement commit (e6b2184) brings in 2.6b work that's still in progress and that the plan doesn't list: `sdlc/2.6b-extend-schedule/intent.md`, `tests/puzzles/createScheduleFromText.test.ts` (129 lines) and `tests/puzzles/getExtendedScheduleText.test.ts` (110 lines). Neither test file has a source module behind it, so `tsc --noEmit`, `npm run lint`, `npm run build` and CI would all go red. This also breaks "One chunk per branch/PR" and "Don't touch files outside the current chunk's scope". The self-check line saying the files match the plan and lint passes is wrong. Fix: remove the three 2.6b files from this branch and keep them on a 2.6b branch, then redo the self-check. — *Response:* fixed. The commit was never pushed, so I redid it as c21a901 without those files. They're untracked in the main checkout again, untouched, for the 2.6b work. I re-ran the self-check in a clean worktree of c21a901: lint clean, 270 tests pass, coverage above the thresholds. The Files line in `plan.md` now says what happened.
2. **should fix** No test has an input that fails both the date check and the schedule check, so if a schedule check ran before `getPuzzleNumber`, every test would stay green. The intent says the first two reasons pass through "unchanged", and the plan says an invalid or before-launch date "never reaches the lookup". Nothing tests either claim. Suggested test: "a date before launch has no puzzle even when the schedule is empty", expecting `before-launch`. — *Response:* fixed. I added that test in c21a901. **Test added after human review.**
3. **nit** No test uses an invalid launch date, so a shortcut that returns line 1 when `date` equals `launchDate`, before either date is checked, stays green. — *Response:* fixed. I added "an invalid launch date has no puzzle, even on the launch date itself" (29 February 2027 for both dates, expecting `invalid-date`) in c21a901. **Test added after human review.**
4. **nit** The plan's Tests table says "the day after the schedule ends has no puzzle" catches "`.at()` wrap-around". It doesn't: `.at()` only wraps negative indexes, and after the guard the index is never negative. — *Response:* fixed. The row now says it catches a modulo, and that the before-launch test covers `.at()` with a negative index.

**Notes:**
- `src/puzzles/findPuzzleForDate.ts` matches the intent and plan: failures pass through, line N is puzzle #N, a missing line returns `after-schedule`, and the result has only `start` and `target`.
- The tests follow AAA with one Act each and use hand-worked literals and a 3-line fixture. Every acceptance criterion has a test.
- Dropping "the same date gets the same puzzle" was argued in the intent and approved at the human stop.
- Naming follows CLAUDE.md.
- Awkward input run by hand: both dates 29 Feb 2027, launch month 13, a fractional day and a NaN year each give `invalid-date`. Before launch with an empty schedule gives `before-launch`, and a year after launch with a 1-line schedule gives `after-schedule`.

## Reviewer's own break-the-code checks
Run with `scripts/break.mjs` in a scratch copy, with the two 2.6b test files removed.
- Off-by-one `schedule[puzzleNumber]`, `schedule[puzzleNumber - 2]`, fixed `schedule[0]` → red (first-, second- and last-line tests; plus past-the-end for −2 and the fixed line)
- Wrap-around with a modulo → red (day after the schedule ends)
- Delete the `getPuzzleNumber` failure guard (alone, and with `.at()`) → red (before launch, invalid date)
- Collapse the failure reasons to `after-schedule`; report invalid as `before-launch` → red (before launch and/or invalid date)
- Delete the `after-schedule` guard → red (day after the schedule ends, empty schedule)
- Swap `date` and `launchDate` → red (second line, last line, past the end, before launch)
- Leak `shortestPathMoves`; swap start and target; return `puzzleNumber - 1` → red (first-, second- and last-line tests)
- `schedule.at(puzzleNumber - 1)` alone → all green. This change behaves the same as the code, so it isn't a gap (finding 4).
- An `after-schedule` check for an empty schedule before `getPuzzleNumber` → all green (finding 2)
- Return line 1 when `date` equals `launchDate`, before checking → all green (finding 3)
- Author's re-run of the two all-green breaks after the fix: schedule check first → red (a date before launch has no puzzle even when the schedule is empty); same-date shortcut → red (an invalid launch date has no puzzle, even on the launch date itself)
