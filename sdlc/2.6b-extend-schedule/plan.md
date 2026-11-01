# 2.6b plan

## Approach
1. `createScheduleFromText` splits on `\n`. The last piece must be empty (the file ends with a newline), or that line is unreadable. Each line must match `^([a-z]+) ([a-z]+) ([1-9][0-9]*)$`, which rules out capitals, blank lines, a `\r`, missing or extra parts and moves of 0, in one place. The first line that doesn't is returned with its 1-based number. No word-list lookups: whether the words are puzzle words is 2.6c's check.
2. `getExtendedScheduleText` reads the text, calls `extendSchedule` with `lastPuzzleNumber: todaysPuzzleNumber + puzzlesAhead`, and returns `getScheduleText` of the result, passing either failure through. `extendSchedule` already never cuts a schedule short, and `getScheduleText` writes back exactly what the reader accepts, so the new text starts with the old.
3. `scripts/buildSchedule.mjs`: read `schedule.txt` if it exists, else `""`; `todaysPuzzleNumber = 0` until 3.8 (named, with a comment); `puzzlesAhead = 365` replaces `puzzlesInSchedule`; print an unreadable line as `schedule.txt line N: unreadable-line`. The header comment says how to rebuild before launch: delete the file and run it. Running it now changes nothing, since the file already holds #1–#365.
4. Backlog: 2.6b renamed and cut to these criteria; new 2.6c (M) with the check criteria and carried-forward lines A1, A6, B1; 2.3 still depends on 2.6b; 3.8 gains 2.6c. B3 answered here (existing lines kept exactly), A2/B4 here (reject capitals).

## Files
- `src/puzzles/createScheduleFromText.ts` — new, about 30 lines
- `src/puzzles/getExtendedScheduleText.ts` — new, about 30 lines
- `scripts/buildSchedule.mjs` — read the file, extend, about 15 lines changed
- `tests/puzzles/createScheduleFromText.test.ts`, `tests/puzzles/getExtendedScheduleText.test.ts` — new
- `backlog.md` — the split above
- `sdlc/2.6b-extend-schedule/` — these records

About 75 lines of `src/` and `scripts/` and 250 of tests, against the ~200 guide; called out in the PR.

## Tests
| Test | Rule |
|---|---|
| reads each line as a puzzle, in order | Line N is puzzle #N (2.6a format); catches swapped fields or a string for moves |
| reads an empty file as an empty schedule | The rebuild path before launch; catches `[""]` read as a bad line |
| rejects a line with a capital letter, giving its line number | Hand edits can't slip past the repeat window (2.6a A2, B4); catches a 0-based number |
| rejects a line with a part missing | File format; catches reading `undefined` as a word |
| rejects a line with an extra part | File format; catches a regex without `$` |
| rejects moves that aren't a whole number above zero | File format; a start and target are at least one move apart |
| rejects a blank line | File format; catches skipping empty lines anywhere but the end |
| rejects a Windows line ending | File format (`.gitattributes` is LF); catches a trim |
| rejects a last line with no newline | New lines would join it, so it's no longer an append (D24) |
| reads the committed schedule file back | The file the build wrote is one it can read and extend |
| extending the schedule adds puzzles up to the requested number ahead of today's | About a year ahead (D24); catches an off-by-one either way |
| keeps the file's existing lines exactly as they are | Published dates never change (D24, 2.6a B3); the lines are ones generation wouldn't pick, so a rebuild fails it |
| leaves a file that already reaches far enough ahead as it is | Same; catches cutting the file to today + ahead |
| builds a schedule from an empty file | Rebuild before launch (D24), as 2.3 needs |
| reports an unreadable line with its line number | Nothing is extended or written from a bad file |
| reports the puzzle number with no puzzle in range | Expected failures return a reason (CLAUDE.md, Conventions) |

## Self-check
- Files: match the list above. `src/` 84 lines with doc comments, `scripts/` 28 added, 14 removed
- Lint, tests and coverage: pass (277 tests). `build:schedule` leaves the committed file unchanged; deleted, it rebuilds byte for byte; a capital on line 3 prints `line 3: unreadable-line`, exits 1, writes nothing
- Diff against intent: reads strictly, extends by appending only, script extends rather than rebuilds; no checks added (2.6c)
