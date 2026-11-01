# 3.1 plan

## Approach
Logic in pure functions, tested with small fixtures; `App` only renders their results; `main.tsx` only wires in the real data and clock.

- `findGameForDate(date, launchDate, gameData)` calls `findPuzzleForDate`, then `createGame(start, target, gameData.acceptedWords)`, so par comes from the accepted words (D8, D27). Either failure is returned with its reason. Puzzle words aren't used: CI checks the schedule's words are in them (2.6c, carried forward).
- `getLocalCalendarDate(now)` reads `getFullYear`, `getMonth() + 1` and `getDate()`: local, never UTC (D6).
- `launchDate` is a named constant, `{ year: 2026, month: 11, day: 1 }`, with a comment that 3.8 sets the real one and it's fixed once results are shared (D15).
- `App({ gameDataResult, today, launchDate })` keeps the `<h1>`, then for a game: `<h2>Puzzle #N</h2>`, `<p>From {start} to {target}</p>`, `<p>Par {par}</p>`, and `<ol aria-label="Your chain">` with one `<li>` per chain word. For `gameDataResult.ok === false` or any `findGameForDate` failure, `<p>There's no puzzle today.</p>` (carried forward: decide what the player sees for `ok: false`). The game isn't React state yet; 3.2 moves it into `useState` when moves change it.
- `main.tsx` passes `getBundledGameData()`, `getLocalCalendarDate(new Date())` and `launchDate`.

App takes the date and data as props, not reading them itself, so jsdom tests use a two-line fixture schedule and a fixed date, and only the browser test uses the real files and clock. No new dependencies.

## Files
- `src/puzzles/findGameForDate.ts` — new
- `src/puzzles/launchDate.ts` — new, the placeholder
- `src/ui/getLocalCalendarDate.ts` — new
- `src/ui/App.tsx` — the puzzle replaces "Coming soon."
- `src/main.tsx` — passes data, today and launch date to `App`
- `tests/puzzles/findGameForDate.test.ts`, `tests/ui/getLocalCalendarDate.test.ts` — new
- `tests/ui/App.test.tsx` — "coming soon" test replaced; heading test now passes props
- `tests/ui/main.browser.test.ts` — mounts once in `beforeAll` with the clock at the launch date; one new test
- `sdlc/3.1-show-todays-puzzle/` — these records

## Tests
| Test | Rule |
|---|---|
| **findGameForDate** | |
| counts the launch date as puzzle #1, so the next day is #2 | Puzzle #1 is the launch date (D15); catches passing `today` as launch or numbering from 0 |
| starts the game at the scheduled start word, aiming at its target | Line N is puzzle #N (D24); catches the wrong line, or start and target swapped |
| works par out over the accepted words, not the puzzle words | Par over accepted words (D27, D8); puzzle words alone have no path |
| reports after-schedule for a date past the last puzzle | No puzzle past the schedule is reported, not failed (D24) |
| reports unreachable when the scheduled words aren't linked by accepted words | `createGame`'s failure isn't swallowed |
| **getLocalCalendarDate** | |
| uses the player's local date, not the UTC date | "Today" is local (D6); TZ is UTC+14 so UTC is a day behind |
| counts months from 1, so January is 1 | `CalendarDate` months are 1–12; catches `getMonth()` unadjusted |
| a time just before midnight is still that day | Day boundary at local midnight (D6); also year end |
| **App** | |
| shows the game's name as the page heading | Kept from 3.0 (D35) |
| shows today's puzzle number | backlog 3.1; number people share (D15) |
| shows the start and target words, start first | backlog 3.1; catches swapped words |
| shows par from the start of the game | Par shown from the start (D9) |
| shows the chain so far as just the start word | backlog 3.1; chain begins with the start word (1.12) |
| doesn't say there's no puzzle when there is one | Catches always rendering the message |
| tells the player there's no puzzle when the date is past the schedule | D24; carried forward from 1.11 |
| tells the player there's no puzzle when the game data can't be read | Carried forward from 1.11 (`ok: false`) |
| **main (browser)** | |
| shows the heading once the entry file mounts the app | Kept from 3.0; Act is now the lookup, mount moved to `beforeAll` |
| shows puzzle #1 when the entry file mounts the app on the launch date | The bundled data, local date and launch date are wired in (D15, D6) |

Changed from 3.0: "tells the player the game is coming soon" is deleted, since the page no longer says it.

## Self-check
- Files (`git diff --name-only main...HEAD`): `sdlc/3.1-show-todays-puzzle/intent.md`, `plan.md`, `src/main.tsx`, `src/puzzles/findGameForDate.ts`, `launchDate.ts`, `src/ui/App.tsx`, `getLocalCalendarDate.ts`, `tests/puzzles/findGameForDate.test.ts`, `tests/ui/App.test.tsx`, `getLocalCalendarDate.test.ts`, `main.browser.test.ts` — match the plan. 92 production lines added, 7 removed
- Lint, tests and coverage: "All matched files use Prettier code style!"; "Tests  354 passed (354)"; "Statements : 100% ( 421/421 )", "Branches : 100% ( 245/245 )". Checked the test set-ups take effect: with UTC getters, 2 `getLocalCalendarDate` tests fail; with the launch date moved to March and `setSystemTime` commented out, "shows puzzle #1" fails
- Diff against intent: the functions and `App` props match the intent's signatures; `findGameForDate.ts` also exports `FindGameForDateResult` and `App.tsx` exports `AppProps`
