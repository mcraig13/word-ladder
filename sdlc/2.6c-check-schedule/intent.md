# 2.6c Check the schedule

**Intent:** check every puzzle in the schedule against the current word lists and D30's repeat window, and that the schedule doesn't run out, so a word-list change or a bad hand edit fails the build rather than reaching players (D24). `build:schedule` runs the checks before it writes; a test runs them on the committed files.
**Signature:** `checkSchedule(schedule, { acceptedWords, puzzleWords, daysBeforeWordRepeats, todaysPuzzleNumber, fewestPuzzlesAhead })` → `{ ok: true }`, `{ ok: false, reason, puzzleNumber }` for the first puzzle that fails (`same-start-and-target`, `not-a-puzzle-word`, `word-repeats-too-soon`, `unsolvable`, `shortest-path-changed`), or `{ ok: false, reason: "too-few-puzzles-ahead", puzzlesAhead }`. `getExtendedScheduleText` gains `fewestPuzzlesAhead` and returns these failures after extending. The script takes an optional schedule file path, so a test can run it on a copy.

## Rules protected
- Start and target are puzzle words (CLAUDE.md, The puzzle; D8), and different words, or the game is won before it starts (2.6b review G3)
- Every puzzle is solvable with the current accepted words (D24, D8)
- A list change can't shift par unnoticed: each puzzle's shortest path still has the moves stored for it (D24, D27)
- No start or target is a start or target again within `daysBeforeWordRepeats` puzzles; 0 turns this off (D30; 2.6a review A1)
- At least 60 puzzles remain after today's (D24)
- The script extends the file it reads, never a rebuild from #1 (D24; 2.6b review B4)

## Acceptance criteria
- passes a schedule that meets every check
- rejects a start / a target that isn't a puzzle word, naming the puzzle
- rejects a puzzle whose start and target are the same word
- rejects a puzzle with no path over the accepted words
- rejects a puzzle whose shortest path has fewer / more moves than stored
- rejects a start that was a target / a target that was a start within the repeat window
- allows a word again once the repeat window has passed / any repeat when the window is 0
- reports the first puzzle that fails
- rejects a schedule with fewer puzzles after today's than the fewest allowed; passes one with exactly that many
- rejects a today's puzzle number that isn't a number as too few puzzles ahead
- extending reports a line already in the file that fails the checks / too few puzzles ahead
- the committed schedule passes the checks with the committed word lists
- the build script keeps the lines of the file it reads rather than rebuilding them

## What I'm least sure of
- **Checking the shortest path of every date, not only published ones.** The backlog and D24 say "published". Before launch nothing is published (today is #0), so that check would do nothing until 3.8 and couldn't be tried on the real file. Checking every date keeps the stored moves true, which 2.3's range check will read, and surfaces a list change when it's made rather than months later when its date is published. The cost: before launch a list change (6.2, 6.3) fails CI until the schedule is rebuilt, which D24 allows freely then. If you want the literal reading, the check takes `puzzleNumber <= todaysPuzzleNumber` and its tests use a today above 0.
- **The script test needs a new dev dependency, `@types/node` (24.x, matching Node 24).** Only running the script can show it reads the file rather than `""` (B4), and the test spawns it with Node's `child_process`, `fs`, `os` and `path`; the project has no Node types, so it doesn't type-check or lint without them. The test pulls them in with a `/// <reference types="node" />` rather than adding them to `tsconfig.json`. If you'd rather not add a dependency, drop this test and B4 stays carried forward.
- **Two slow tests.** One shortest-path search per puzzle on the real lists is about 25 s for 365 puzzles, so the committed-files test and the script test each get a 60 s timeout, and `npm test` and each break run take about 30 s longer. Per the agreed approach, performance waits for end-to-end; one search per start word instead of per puzzle is the obvious speed-up later.

**Also:** the 60-days check can't fail in CI until 3.8 works today's number out from the clock, and the committed-files test must then do the same. It's written as "at least 60", so a `NaN` today fails, which answers half of 3.8's carried line G4.

## Out of scope
- Checking `scheduleSeed` (2.6a review A6): it's one constant in the script, and a bad value still builds a schedule these checks pass. I propose dropping the carried line.
- A check on the build's time (2.2 review B1): performance waits for end-to-end; the carried line moves to 3.8.
- Which shortest-path range the schedule uses (D16): 2.3. The launch date and today's number from the clock: 3.8.
