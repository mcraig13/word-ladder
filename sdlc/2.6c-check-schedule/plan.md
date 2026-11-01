# 2.6c plan

## Approach
1. `src/puzzles/checkSchedule.ts`: one pass over the schedule in order, returning the first puzzle that fails with its 1-based number. Per puzzle, in this order: start equals target (`same-start-and-target`), start or target not in `puzzleWords` (`not-a-puzzle-word`; this also catches a wrong length), start or target among the starts and targets of the `daysBeforeWordRepeats` puzzles before it (`word-repeats-too-soon`; a window of 0 checks nothing, avoiding `slice(-0)`), `findShortestPath` over `acceptedWords` fails (`unsolvable`), its moves differ from `shortestPathMoves` (`shortest-path-changed`). Same-start comes first because the shortest-path check would otherwise report it less clearly. After the pass: `puzzlesAhead = schedule.length - todaysPuzzleNumber`, failing unless `puzzlesAhead >= fewestPuzzlesAhead`, so `NaN` fails.
2. `getExtendedScheduleText`: new option `fewestPuzzlesAhead`; after extending, run `checkSchedule` on the whole extended schedule and pass a failure through. One pass after extending covers both the file's lines and the new ones.
3. `scripts/buildSchedule.mjs`: `fewestPuzzlesAhead = 60` (D24); the schedule file is `process.argv[2]`, defaulting to `data/puzzles/schedule.txt`, with its folder made from the path; failures print `Puzzle #N: reason` or `<file>: too-few-puzzles-ahead (N ahead)`. Header comment says the checks run before writing.
4. Backlog: 2.6c's carried-forward lines answered (A1, G3, B4, "published" here; A6 dropped; B1 moved to 3.8); 3.8's G4 line notes that `NaN` is now caught.

## Files
- `src/puzzles/checkSchedule.ts` — new, about 50 lines
- `src/puzzles/getExtendedScheduleText.ts` — the option and the check, about 10 lines
- `scripts/buildSchedule.mjs` — about 10 lines changed
- `tests/puzzles/checkSchedule.test.ts`, `checkSchedule.scowl.test.ts`, `tests/scripts/buildSchedule.test.ts` — new
- `tests/puzzles/getExtendedScheduleText.test.ts` — `fewestPuzzlesAhead: 0` in the shared options, two tests added
- `src/core/getWordsOneLetterAway.ts` — added after the human stop: looks up each one-letter change instead of scanning every word (see Self-check)
- `package.json`, `package-lock.json` — `@types/node` 24.x as a dev dependency, for the script test only (intent, least sure 2)
- `backlog.md` — as in step 4
- `sdlc/2.6c-check-schedule/` — these records

About 70 lines of `src/` and `scripts/`, 410 of tests, over the ~200 guide on tests as 2.6b was; called out in the PR.

## Tests
| Test | Rule |
|---|---|
| passes a schedule that meets every check | All checks together; catches a check that fails good input |
| rejects a start that isn't a puzzle word, naming the puzzle | Start is a puzzle word (D8); at #2, catches a 0-based number |
| rejects a target that isn't a puzzle word, naming the puzzle | Same for the target; catches checking only the start |
| rejects a puzzle whose start and target are the same word | Game not won before it starts (G3); catches the check running after the shortest path |
| rejects a puzzle with no path over the accepted words | Solvable (D24) |
| rejects a puzzle whose shortest path has fewer moves than stored | Par can't shift (D24); a word added |
| rejects a puzzle whose shortest path has more moves than stored | Same, a word removed; together they catch `<` or `>` for `!==` |
| rejects a start that was a target within the repeat window | D30, at the window's edge; catches a window one short, and collecting only starts |
| rejects a target that was a start within the repeat window | D30; catches checking only the start, and collecting only targets |
| allows a word again once the repeat window has passed | D30; catches a window one too long |
| allows any repeat when the repeat window is 0 | D30, 0 turns it off; catches `slice(-0)` |
| reports the first puzzle that fails | Result names the puzzle to fix; catches reporting the last |
| rejects a schedule with fewer puzzles after today's than the fewest allowed | 60 days left (D24) |
| passes a schedule with exactly the fewest puzzles allowed after today's | Same; catches `>` for `>=` |
| rejects a today's puzzle number that isn't a number as too few puzzles ahead | Same; catches `<` written so `NaN` passes (3.8 G4) |
| extending reports a line already in the file that fails the checks | The build checks before it writes |
| extending reports too few puzzles ahead | Same, the whole-schedule failure |
| the committed schedule passes the checks with the committed word lists | CI catches a list change nobody rebuilt for (D24) |
| the build script keeps the lines of the file it reads rather than rebuilding them | Append only (D24, B4); catches reading `""` or ignoring the path |

The order between different reasons isn't a rule, so only same-start-before-shortest-path is tested.

## Self-check
- Files: match the list, plus `getWordsOneLetterAway.ts`, agreed with the human after implementing. Under `test:coverage` the committed-files test took 135 s, past its 60 s timeout, and the scan made 4 billion calls to `areWordsOneLetterApart`, overflowing v8's counter so a covered branch read as missed. Order and results are unchanged: a full rebuild matches the committed schedule byte for byte. `src/` and `scripts/` 145 lines added, 19 removed
- Lint, tests and coverage: pass (310 tests, 100%, about 7 s). By hand: the script leaves the committed file unchanged, extends its first 10 lines back to the committed file, and a wrong stored count on line 3 prints `Puzzle #3: shortest-path-changed` and exits 1
- Diff against intent: every check from the signature, run by the script before writing and by a test on the committed files; no rule changes. The intent's timings (25 s, 60 s timeouts) predate the speed-up; the timeouts stay as approved
