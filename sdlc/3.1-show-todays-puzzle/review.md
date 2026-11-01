# 3.1 review

Two reviewers in parallel, fresh context each (M chunk, D29). Tests changed after human review: three, all in response to findings below (E1, E2/B2, B1), none weakened. No production code changed after review.

## Everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The change does what the intent says and stays in scope. The diff (`git diff --stat main...HEAD`) touches exactly the files in the plan's list. Production code is small and reads well. Every acceptance criterion has a test with the same name.

### Findings
1. **should fix** "tells the player there's no puzzle when the game data can't be read" (`tests/ui/App.test.tsx`) shows the message for a second reason too: the fixture's accepted words are only `cold` and `warm`, so line 1 is also unreachable. If the capital in `Cold warm 4` were ever read as valid, the test would stay green for the wrong reason. — *Response:* fixed. **Test changed after human review:** the fixture's accepted words now link cold to warm (`cold cord card ward warm`), with a comment saying the capital is the only reason for the message.
2. **nit** "a time just before midnight is still that day" (`tests/ui/getLocalCalendarDate.test.ts`) can't catch reading the UTC date: in UTC+14, 23:59 local is the same UTC date. The year doesn't change either side of it, so it doesn't check the year end as the plan says. The risky side is just after midnight. — *Response:* fixed with B2 below. **Test added after human review:** "a time just after midnight is already the new day, and the new year" (00:00:01 on 1 January 2027 local, still 31 December 2026 in UTC). The before-midnight test is kept: it's an acceptance criterion and still checks the day doesn't roll over early.
3. **note** `App` runs `findGameForDate`'s shortest-path search on every render (about 11 ms on the bundled data, twice in StrictMode dev). When 3.2 moves the game into `useState`, a lazy initialiser keeps it from running on every move. — *Response:* not changed (fine for now, per the defer-performance guidance); carried forward to 3.2 in `backlog.md`.

**Notes:**
- `npm run lint` and `npm test` pass (35 files, 354 tests at review).
- `findGameForDate` on the bundled data for all 365 scheduled dates: expected puzzle numbers, par = ceil(1.5 × stored moves), start words are puzzle words. Day after the schedule gives `after-schedule`, 31 Oct 2026 `before-launch`, 30 Feb `invalid-date`; `App` before launch shows only the heading and the no-puzzle message.
- Setting `process.env.TZ` at runtime takes effect in Vitest's jsdom workers (Node 24): a UTC version fails two tests.
- Accepted and puzzle words differ in the fixtures (D31); start and target differ, so swaps fail.
- The browser test's Act is a locator lookup since mounting moved to `beforeAll`; acceptable, as the plan says.
- Names follow CLAUDE.md; `launchDate` is named with a comment; no new dependencies; `key={word}` is safe since a word can't repeat in the chain (D13).

## Breaks

**Reviewer:** independent agent, fresh context, focus: breaks · **Verdict:** approve with changes

### Findings
1. **should fix** The browser test doesn't check that `main.tsx` reads today's date from the clock: on the launch date, today equals the launch date, so `today={launchDate}` and `launchDate={getLocalCalendarDate(new Date())}` both left every test green. — *Response:* fixed. **Test changed after human review:** the clock is now set to noon on the day after launch and the test is renamed "shows puzzle #2 when the entry file mounts the app the day after launch", expecting "Puzzle #2". Both breaks now go red (re-run below).
2. **should fix** No test checks that `getLocalCalendarDate` takes the year from the local date: `getUTCFullYear()` left every test green. — *Response:* fixed by the new test in E2 above; the break now goes red (re-run below).

**Notes:** the 10 `findGameForDate` and `App` breaks went red on the test named for each rule. A date that isn't a real date gives `{ NaN, NaN, NaN }`, which `getPuzzleNumber` reports as invalid-date, so the page shows the no-puzzle message. `npm run lint` and `tsc --noEmit` pass; 354 tests pass in the scratch copy, browser project included.

### Reviewer's break-the-code checks
All 24 breaks are in `breaks.json`.
- `findGameForDate`: date and launch date swapped; par over puzzle words; start and target swapped; puzzle number off by one; puzzle-failure guard deleted; game-failure guard deleted or reason changed → each red on the test named for it
- `getLocalCalendarDate`: `getUTCDate` / `getUTCMonth` → red; months from 0 / `getDay` → red; `getUTCFullYear` → **all green** (finding 2)
- `App`: today and launch date swapped; unreadable-data guard removed; puzzle number not a heading; start and target swapped on screen; par removed; chain shows the target; chain's name removed; no-puzzle message shown beside the puzzle; message emptied → each red
- `main`: game data unreadable → red; `today={launchDate}` → **all green**; launch date set to the clock's date → **all green** (finding 1)

## Re-run after fixes
`npm run break -- sdlc/3.1-show-todays-puzzle/breaks.json`: "24 breaks: 0 not applied, 0 all green." The three that were green are now red: `getUTCFullYear` on "a time just after midnight is already the new day, and the new year"; both `main` wiring breaks on "shows puzzle #2 when the entry file mounts the app the day after launch". After fixes: "Tests  355 passed (355)", lint passes.
