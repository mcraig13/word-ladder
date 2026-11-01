# 1.11 Load word lists

**Intent:** give the app the built accepted words, puzzle words and puzzle schedule as ready-to-use values at start, so 3.1 can find today's puzzle (2.4) and create the game (1.10). The files are bundled at build time with Vite `?raw` imports, so there's no fetch, loading state or network error (backlog 1.11).
**Signature:**
- `createGameDataFromText({ acceptedWordsText, puzzleWordsText, scheduleText })` → `{ ok: true, gameData: { acceptedWords, puzzleWords, schedule } }` or `{ ok: false, reason: "unreadable-schedule-line", lineNumber }`. Pure: the texts are passed in.
- `getBundledGameData()` → the same result for the committed `data/words/accepted.txt`, `puzzle.txt` and `data/puzzles/schedule.txt`.

## Rules protected
- Start and target come from the puzzle words; moves are checked against the accepted words, so the two stay separate (CLAUDE.md, The puzzle; D8)
- Every puzzle word is an accepted word, so every puzzle is solvable (D8)
- Line N of the schedule is puzzle #N, read as `createScheduleFromText` reads it (D24)
- The data reaches the app with no I/O at runtime, and `src/core/` stays pure (D21)

## Acceptance criteria
- loads accepted words and puzzle words as separate dictionaries (as two tests: accepted words include a word that isn't a puzzle word; puzzle words leave it out)
- reads the last word in a list, before the final newline
- reads the schedule text as the schedule, line N as puzzle #N
- an unreadable schedule line gives no game data, with its line number
- every puzzle word is also an accepted word (on the bundled files)
- the bundled accepted and puzzle words are the words in their files, counted by line
- the bundled schedule has one puzzle for each line of schedule.txt
- the bundled accepted words include every word in the rules' example

## What I'm least sure of
- **Returning a result rather than throwing on a bad schedule.** The committed schedule is checked in CI, so `ok: false` should never happen in the app; but a throw in `getBundledGameData` would be a branch no test runs, and D33 keeps coverage at 100% for everything but `main.tsx`. So 3.1 decides what the player sees for `ok: false` (likely the same "no puzzle" message as `after-schedule`). If you'd rather throw at start, `getBundledGameData` would need excluding from coverage like `main.tsx`.
- **Loading puzzle words at all.** The daily game needs only the accepted words and the schedule: start and target come from the schedule, built at build time (D24). Puzzle words add about 13 KB that no soft-launch code reads; practice mode (5.1) would. I kept them because the backlog entry asks for both. Dropping them would remove the separate-dictionaries tests.
- **Not calling it from `App` yet.** 1.11 provides the data; 3.1, which shows it, makes the call, so 1.11 has no UI change and the "coming soon" page stays. If "at app start" should mean wired into `App` now, the call would be added there with a test that the page still renders.

## Out of scope
- Showing today's puzzle and what the player sees when there's none: 3.1
- Reading the player's date and setting the launch date: 3.1, 3.8
- Checking word list lines: the lists are rebuilt and compared in CI, and `createDictionaryFromWords` ignores non-words (1.2)
- Lazy loading or splitting the bundle: deferred until there's a measured need
