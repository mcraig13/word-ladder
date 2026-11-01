# 2.5 plan

## Approach
`getPuzzleNumber` checks both dates first, then counts the days between them. Each date becomes a day count with `Date.UTC(year, month − 1, day) / MILLISECONDS_PER_DAY`: UTC has no clock changes, so the count is exact, and nothing reads the clock. A date is valid if it's whole numbers and builds back to the same year, month and day (`getUTCFullYear` and so on), which catches 29 February in a year that isn't a leap year, month 13, day 0 and fractions. Then `daysSinceLaunch < 0` is `before-launch`, otherwise `puzzleNumber = daysSinceLaunch + 1`.

`CalendarDate` is exported from the same file so 2.4 and the app can use it. The file goes in `src/puzzles/`, the home of daily numbering (CLAUDE.md, Project layout).

## Files
- `src/puzzles/getPuzzleNumber.ts` — new: `CalendarDate`, `GetPuzzleNumberResult`, `getPuzzleNumber`
- `tests/puzzles/getPuzzleNumber.test.ts` — new
- `sdlc/2.5-puzzle-number/` — these records

## Tests
| Test | Rule |
|---|---|
| the launch date is puzzle #1 | Puzzle #1 is the launch date (D15); catches counting from 0 |
| the day after launch is puzzle #2 | The number goes up by one each day (D15) |
| counts across a month boundary | Every calendar day counts, whatever the month (D15) |
| counts across a year boundary | As above, across years; catches counting from the day of the year |
| counts February 29 in a leap year | Leap days are days (D15) |
| goes straight from February 28 to March 1 in a year that isn't a leap year | No made-up leap day; with the one above, catches a fixed year length |
| the day before launch has no puzzle number | No puzzle number before launch (backlog 2.5); catches `<= 0` becoming `< -1` and comparing month and day only |
| rejects February 29 in a year that isn't a leap year | An invalid date is reported, not rolled on to 1 March |
| rejects month 13 | As above, not rolled on to next January |
| rejects a day that isn't a whole number | As above, not truncated (2.4's carried-forward note) |
| rejects an invalid launch date | Both dates are checked, not just the first |
| reports an invalid date before launch as invalid, not before launch | Checks run in order: validity, then launch |

## Self-check
- Files:
- Lint, tests and coverage:
- Diff against intent:
