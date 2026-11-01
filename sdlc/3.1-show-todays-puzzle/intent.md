# 3.1 Show today's puzzle

**Intent:** replace "Coming soon" with today's puzzle: its number, start and target words, par, and the chain so far (only the start word until 3.2 adds moves). This is the first time the bundled word lists and schedule (1.11) reach the player. When there's no puzzle to show, the player sees one plain message instead.
**Signature:**
- `findGameForDate(date, launchDate, gameData)` in `src/puzzles/`: `{ ok: true, puzzleNumber, game }`, or `{ ok: false, reason }` with `findPuzzleForDate`'s or `createGame`'s reason.
- `getLocalCalendarDate(now: Date): CalendarDate` in `src/ui/`: the player's local date (D6).
- `launchDate` in `src/puzzles/launchDate.ts`: a placeholder until 3.8 sets the real one.
- `App({ gameDataResult, today, launchDate })`: the page. `main.tsx` passes `getBundledGameData()`, `getLocalCalendarDate(new Date())` and `launchDate`.

## Rules protected
- One daily puzzle, the same for everyone on a date; "today" is the player's local date (D5, D6)
- Puzzle #1 is the launch date, and line N of the schedule is puzzle #N (D15, D24)
- Par is shown from the start, worked out over the accepted words, not the puzzle words (D9, D27, D8)
- The chain begins with the start word (CLAUDE.md Moves; 1.12)
- A date with no puzzle reports that there's none, rather than failing some other way (D24)

## Acceptance criteria
- `findGameForDate`: counts the launch date as puzzle #1, so the next day is #2 · starts the game at the scheduled start word, aiming at its target · works par out over the accepted words, not the puzzle words · reports after-schedule for a date past the last puzzle · reports unreachable when the scheduled words aren't linked by accepted words
- `getLocalCalendarDate`: uses the player's local date, not the UTC date · counts months from 1 · a time just before midnight is still that day
- `App`: shows the game's name as the page heading · shows the puzzle number · shows the start and target words · shows par · shows the chain so far as just the start word · tells the player there's no puzzle when the date is past the schedule · tells the player there's no puzzle when the game data can't be read
- Browser: shows puzzle #1 when the entry file mounts the app on the launch date

## What I'm least sure of
- **One message for every way there's no puzzle.** Before launch, past the schedule, unreadable data and an unreachable puzzle all show "There's no puzzle today." Only past-the-schedule can happen to a player once CI's checks pass, and none of these need the player to act. A "first puzzle on <date>" message before launch would help only if the link goes out early; I'd split it out if you plan that.
- **The placeholder launch date is 1 November 2026.** The app needs one to show anything, and 3.8 sets the real one (D15). With today as the placeholder, `npm run dev` shows a puzzle now. Nothing has been shared, so changing it later breaks no one's results. A date in the future would show the no-puzzle message until then.
- **Words shown lowercase, as stored.** "From cold to warm", not "COLD". Capitals are a style choice (CSS `text-transform`, which keeps screen readers reading words, not letters); 3.6's layout can make it.
- **The timezone test sets `process.env.TZ`** so local and UTC dates differ; otherwise a version using UTC passes on a UTC machine such as CI. It restores TZ afterwards. If Node doesn't apply TZ changes at runtime in Vitest's workers, the test needs another way in.

## Out of scope
- Entering moves, messages for rejected words (3.2); undo (3.3); give up and the shortest path (3.4); win screen and score (3.5)
- Styling and phone layout (3.6), how-to-play and the SCOWL credit (3.7)
- Setting the real launch date, and `build:schedule` reading it (3.8)
- A page left open past midnight showing the new day's puzzle (3.9)
