# 2.4 plan

## Approach
`findPuzzleForDate` calls `getPuzzleNumber(date, launchDate)` and returns its failure unchanged, so an invalid date or a date before launch never reaches the lookup. Otherwise it reads `schedule[puzzleNumber - 1]`; with `noUncheckedIndexedAccess` that's possibly undefined, which is `after-schedule`. It returns `puzzleNumber` and a new `{ start, target }` built from the line, leaving out `shortestPathMoves` (intent, least sure). No clock, no seed, no I/O: the schedule is an argument, and 1.11 reads the file.

The result type `FindPuzzleForDateResult` and the puzzle type (`{ start, target }`, named `PuzzleForDate`) are exported from the same file for 1.11 and the UI. It reuses `CalendarDate` from `getPuzzleNumber.ts` and `Schedule` from `extendSchedule.ts`.

## Files
- `src/puzzles/findPuzzleForDate.ts` — new: `PuzzleForDate`, `FindPuzzleForDateResult`, `findPuzzleForDate`
- `tests/puzzles/findPuzzleForDate.test.ts` — new
- `sdlc/2.4-puzzle-for-date/` — these records

## Tests
| Test | Rule |
|---|---|
| the launch date gets the first puzzle in the schedule | Puzzle #1 is the launch date, line 1 (D15, D24); catches reading `schedule[puzzleNumber]` |
| the day after launch gets the puzzle on the second line | Consecutive dates get consecutive lines (backlog 2.4); catches a fixed line |
| the last scheduled date gets the last puzzle in the schedule | Every scheduled line is reachable; catches `>=` against the length |
| the day after the schedule ends has no puzzle | Past the end there's no puzzle (D24, Running out); catches a modulo wrap-around (`.at()` only wraps a negative index, which the before-launch test covers; review 4) |
| an empty schedule has no puzzle on the launch date | As above, at its smallest |
| a date before launch has no puzzle, with the reason from getPuzzleNumber | getPuzzleNumber's reason passes through; catches looking up puzzle #0 with `.at(-1)` |
| an invalid date has no puzzle, with the reason from getPuzzleNumber | As above for an invalid date (2.5) |
| a date before launch has no puzzle even when the schedule is empty | The date is checked before the lookup; catches a schedule check first (added after review 2) |
| an invalid launch date has no puzzle, even on the launch date itself | The launch date's failure passes through too; catches a same-date shortcut before checking (added after review 3) |

## Self-check
- Files: `src/puzzles/findPuzzleForDate.ts` and its test, as listed; no others (the first commit swept in 2.6b's untracked files and was redone, review 1).
- Lint, tests and coverage: lint clean; 9 tests in this file, the whole suite passes, coverage above the thresholds with no file missing coverage.
- Diff against intent: getPuzzleNumber's failures pass through unchanged, line N is puzzle #N, a missing line is `after-schedule`, and the result has only start and target.
