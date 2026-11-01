# 2.5 Puzzle number

**Intent:** turn the player's local date into the puzzle number people share, counting from #1 on the launch date (D15). The number is how friends know they played the same puzzle (D5).
**Signature:**
- `CalendarDate` = `{ year, month, day }`, month 1–12: a date on the calendar with no time or timezone. The app builds it from the player's local date (D6).
- `getPuzzleNumber(date, launchDate)` → `{ ok: true, puzzleNumber }` or `{ ok: false, reason: "invalid-date" | "before-launch" }`. The date is checked before the launch, so an invalid date is never reported as before launch.
- The launch date is a parameter: it's set in 3.8, and tests need their own.

## Rules protected
- Puzzle #1 is the launch date; the number goes up by one each day (CLAUDE.md, The puzzle; D15)
- "Today" is the player's local date, passed in; no clock read (D6)
- An invalid date is reported, not turned into a puzzle quietly (2.4's carried-forward note, applied here to numbering)

## Acceptance criteria
- the launch date is puzzle #1
- the day after launch is puzzle #2
- counts across a month boundary
- counts across a year boundary
- counts February 29 in a leap year
- goes straight from February 28 to March 1 in a year that isn't a leap year
- the day before launch has no puzzle number
- rejects February 29 in a year that isn't a leap year
- rejects month 13
- rejects a day that isn't a whole number
- rejects an invalid launch date
- reports an invalid date before launch as invalid, not before launch

## What I'm least sure of
- **`{ year, month, day }` rather than a JS `Date` or an ISO string.** A `Date` carries a time and a timezone, so the same `Date` gives different days on different devices, and counting milliseconds across a clock change is out by an hour. A plain date makes the local-date rule (D6) the app's job, visibly. An ISO string `"2027-01-15"` would also work and needs parsing. If 3.0's framework or 3.9's storage favours strings, I'd switch.
- **`Date.UTC` inside the function.** It counts days with no timezone or clock change, and the clock is never read, but it is `Date`. `src/puzzles/` isn't under the pure-code lint rule, so it's allowed; a hand-written day count would avoid `Date` at the cost of an algorithm full of calendar constants. Side effect: `Date.UTC` treats years 0–99 as 1900–1999, so those years are reported invalid. No real puzzle date is affected.
- **A result object with a `get…` name.** CLAUDE.md says `get…` works out a value and `check…` returns a reason. This works out a value that can fail in expected ways, so I kept `get…` and the result-object convention. `findPuzzleNumber` returning `undefined` would lose the difference between invalid and before launch.

## Out of scope
- Setting the launch date: 3.8
- Reading the player's local date: the app (Phase 3)
- Turning a date or puzzle number into a seed and a puzzle: 2.4
- Showing the number: Phase 3
