# 2.3 plan

## Approach
Add the range check to `findPuzzleFailure` in `checkSchedule`, after the shortest-path-changed check, so it reads stored moves already shown to be true. It applies only when the puzzle's number is above `todaysPuzzleNumber`. `getExtendedScheduleText` passes `shortestPathMoves` from its options, which `extendSchedule` already uses to generate, so one range drives both. No regeneration: the committed schedule is all 4–6 already.

## Files
- `src/puzzles/checkSchedule.ts` — `shortestPathMoves` option, `shortest-path-out-of-range` reason, the check
- `src/puzzles/getExtendedScheduleText.ts` — pass the range to `checkSchedule`
- `scripts/buildSchedule.mjs` — the range comment says D16, not a placeholder
- `tests/puzzles/checkSchedule.test.ts` — default range of 1–4 in `ladderOptions`, six new tests
- `tests/puzzles/getExtendedScheduleText.test.ts` — one new test; four tests get `RANGE_FOR_EXISTING_LINES` (intent, least sure 2)
- `tests/puzzles/checkSchedule.scowl.test.ts` — passes D16's range
- `DECISIONS.md`, `backlog.md`, `CLAUDE.md` — D16 decided (done in session A)

## Tests
| Test | Rule |
|---|---|
| rejects a puzzle after today's whose shortest path is shorter than the range allows | D16, fewest |
| rejects a puzzle after today's whose shortest path is longer than the range allows | D16, most |
| passes puzzles at exactly the fewest and the most moves the range allows | D16, range is inclusive |
| leaves today's and earlier puzzles out of the range check | D24, published dates don't change |
| range-checks the first puzzle after today's | D16, from the first unpublished date |
| reports a changed shortest path as changed, not out of range | D24, 2.6c: the changed check comes first |
| extending checks the file's lines against the shortest-path range it is given | D16, D24: lines already in the file are checked |
| the committed schedule passes the checks with the committed word lists | D16 on the real files (backlog 2.3) |

Changed tests (range only, to keep their 1- and 2-move lines passing): `leaves a file that already reaches far enough ahead as it is`, `extending reports too few puzzles ahead`, `extending checks the file's lines with the repeat window it is given`, `extending counts the puzzles ahead from today's puzzle number`.

## Self-check
- Files: the three source files in the plan; tests and records as committed at the human stop. No test changed since.
- Lint, tests and coverage: lint clean; 324 tests pass; coverage 100% statements, branches, functions and lines.
- Diff against intent: puzzles after today's outside the range fail as `shortest-path-out-of-range`, after the changed check; `getExtendedScheduleText` passes its range. Also written so a NaN end fails, as G4.
