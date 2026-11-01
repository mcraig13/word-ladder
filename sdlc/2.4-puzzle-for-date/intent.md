# 2.4 Puzzle for a date

**Intent:** given the player's local date, the launch date and the schedule, find that date's start and target, so everyone playing on one date gets the same puzzle (D5, D6). The puzzle comes from the schedule line for the date's puzzle number (D24), so published dates never change.
**Signature:** `findPuzzleForDate(date, launchDate, schedule)` → `{ ok: true, puzzleNumber, puzzle: { start, target } }` or `{ ok: false, reason: "invalid-date" | "before-launch" | "after-schedule" }`. The first two reasons come from `getPuzzleNumber` unchanged; `after-schedule` is a date with no line in the schedule.

## Rules protected
- One daily puzzle, the same for everyone on a given date (CLAUDE.md, The puzzle; D5)
- "Today" is the player's local date, passed in; nothing reads the clock (D6)
- Puzzle #1 is the launch date, and line N of the schedule is puzzle #N (D15, D24)
- A date past the end of the schedule reports that there's no puzzle, rather than failing some other way (D24, Running out)

## Acceptance criteria
- the launch date gets the first puzzle in the schedule
- the day after launch gets the puzzle on the second line
- the last scheduled date gets the last puzzle in the schedule
- the day after the schedule ends has no puzzle
- an empty schedule has no puzzle on the launch date
- a date before launch has no puzzle, with the reason from getPuzzleNumber
- an invalid date has no puzzle, with the reason from getPuzzleNumber

## What I'm least sure of
- **Dropping "the same date gets the same puzzle" as its own test.** The function is pure and takes no seed, so the only way the same date could get a different puzzle is a different line, which the line-for-number tests already pin. Testing it directly needs two Acts, or one that compares two calls, which CLAUDE.md doesn't allow. "Consecutive dates get consecutive lines" became the second test above. If you'd rather keep a direct test, I'd assert that a date gets the same puzzle when the date is a new object with the same year, month and day.
- **Returning only start and target, not `shortestPathMoves`.** D24 says par isn't stored; the app works it out (1.10). Leaving the moves out stops the app using the stored number as par by accident. The positive tests use `toEqual`, so an extra field fails them. If 1.11 or 3.x want the stored moves, they'd be added here.
- **The name and the reason `after-schedule`.** `find…` because it looks something up and may find nothing, with a reason, as `findShortestPath` does. Returning `puzzleNumber` too saves the app a second call to `getPuzzleNumber` to show it. `after-schedule` could be `no-puzzle-scheduled`; I picked the one that says why.

## Out of scope
- Reading `data/puzzles/schedule.txt` at app start: 1.11
- Reading the player's local date and setting the launch date: Phase 3, 3.8
- Working out par for the puzzle: `createGame` (1.10)
- The build check that 60 days remain: 2.6b
