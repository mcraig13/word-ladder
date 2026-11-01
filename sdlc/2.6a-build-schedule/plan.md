# 2.6a plan

## Approach
1. `extendSchedule` copies the existing schedule, then for each puzzle number from `schedule.length + 1` to `lastPuzzleNumber` calls `generatePuzzle` with seed `(scheduleSeed + puzzleNumber) >>> 0` and the range and accepted words passed through. Its puzzle words are the puzzle words of the length less every start and target in the last `daysBeforeWordRepeats` puzzles so far (existing and new), made with `createDictionaryFromWords`, so `generatePuzzle` doesn't change. The first failure returns `no-puzzle-in-range` with that puzzle number. A schedule already at or past the last number comes back unchanged, never cut short (published dates never change).
2. Each puzzle's moves come from `findShortestPath` over the accepted words, a separate search from the one that picked it, so the stored number is a cross-check rather than a copy. It doubles the cost of a date (see timing).
3. `getScheduleText` writes `start target moves\n` per puzzle.
4. `scripts/buildSchedule.mjs`, like `buildWordLists.mjs`: reads the built word lists, extends `[]` to 365 puzzles, writes the file or prints the failing puzzle number and exits 1. Named constants: schedule seed, puzzles in the schedule, D16's range, word length, days before a word repeats (365). Until 2.6b it always rebuilds from #1, which D24 allows before launch.
5. Run it and commit `data/puzzles/schedule.txt`.

**Timing (measured on the real lists, 10 seeds):** `generatePuzzle` about 100 ms a call, `findShortestPath` about 80 ms, so a year is about 65 s. The 365-day window cost nothing measurable (intent, least sure 3). Fine before soft launch; no test runs it.

## Files
- `src/puzzles/extendSchedule.ts` — new, about 55 lines, with `ScheduledPuzzle`, `Schedule` and the result type
- `src/puzzles/getScheduleText.ts` — new, about 10 lines
- `scripts/buildSchedule.mjs` — new, about 40 lines (not covered, like `buildWordLists.mjs`)
- `package.json` — `build:schedule` script
- `data/puzzles/schedule.txt` — new, generated
- `CLAUDE.md` — `build:schedule` under Commands, `data/puzzles/` in the layout
- `tests/puzzles/extendSchedule.test.ts`, `tests/puzzles/getScheduleText.test.ts` — new
- `DECISIONS.md` — D30, the repeat window, and a line under D24 pointing to it
- `backlog.md` — 2.6 split into 2.6a and 2.6b; 2.6b gets the criteria left over and the carried-forward lines
- `sdlc/2.6a-build-schedule/` — these records

## Tests
| Test | Rule |
|---|---|
| builds one puzzle for each number up to the last puzzle number | A puzzle for every date in the schedule (D24) |
| every scheduled puzzle's shortest path is within the requested range | Range in moves of the shortest path (D16, D27); catches the range not passed through |
| records each puzzle's shortest path moves | 2.6b's published-date check needs the true moves (intent, least sure 1); catches storing `most` or `fewest` |
| builds puzzles of the requested word length | Word length is a parameter (D4); catches a hard-coded 4 |
| keeps every existing puzzle unchanged when extending | Published dates never change (D24); the existing lines are ones generation wouldn't pick, so a rebuild fails it |
| adds puzzles after the existing ones up to the last puzzle number | Extending adds dates (D24); catches an off-by-one at either end |
| leaves a schedule that already reaches the last puzzle number as it is | Published dates never change (D24); catches cutting the schedule to the last number |
| the same seed builds the same schedule | Same date, same puzzle (D5, D24) |
| extending gives the same puzzles as building the whole schedule at once | Each date's puzzle depends on its number, not the run (intent, least sure 2); catches a seed from the position in the run |
| gives different puzzle numbers different puzzles | Catches one seed for every date |
| never uses a start or target word again within the repeat window | D30; catches the window not applied to puzzles built in this run |
| counts the existing schedule's last puzzles in the repeat window | D30; catches looking only at new puzzles, and a window one puzzle short |
| uses a word again once the repeat window has passed | D30; catches a window one puzzle too long, which would leave no puzzle |
| reports the puzzle number that has no puzzle in range | Expected failures return a reason (CLAUDE.md, Conventions); the number says which date to look at |
| writes one line per puzzle, in order, as start, target and moves | The file format (intent) that 2.4 and 2.6b read |
| writes an empty file for an empty schedule | Same; no stray blank line |

Fixtures use the 2.2 `LADDER` (cold–cord–card–ward–warm, a line), so moves are positions apart. Tests over many puzzles compare sets of `"first-second"` pairs, as in 2.2, because which direction a seed picks isn't worked out by hand. Tests not about D30 set `daysBeforeWordRepeats: 0`, since `LADDER`'s five words can't fill a window.

## Self-check
- Files: match the list above. `src/` and `scripts/` are 142 lines; with the tests approved at the human stop, 520 against the ~200 guide (called out in the PR).
- Lint, tests and coverage: pass, 258 tests, 100% on all four measures. `build:schedule` took 63 s: 365 puzzles, all 4–6 moves, 730 different starts and targets.
- Diff against intent: as intended. The cross-check search can't fail after generation succeeds, so both share one failure return rather than an uncoverable branch (D20).
