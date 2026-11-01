# 2.6a Build the puzzle schedule

**Intent:** build the schedule file: a start and target for each puzzle number from #1, a year of them, so every player gets the same puzzle for a date and a word-list change never reshuffles published dates (D24). 2.4 looks a date's puzzle up in it.
**Signature:** `extendSchedule(schedule, { acceptedWords, puzzleWords, wordLength, shortestPathMoves: { fewest, most }, scheduleSeed, daysBeforeWordRepeats, lastPuzzleNumber })` → `{ ok: true, schedule }` or `{ ok: false, reason: "no-puzzle-in-range", puzzleNumber }`. A schedule is a list of `{ start, target, shortestPathMoves }`; the first is puzzle #1. Building from nothing is extending `[]`. `getScheduleText(schedule)` → the file's text. `npm run build:schedule` writes `data/puzzles/schedule.txt`.

**Split (backlog: "if the script and its checks go over the size limit, split them"):** 2.6a builds and writes the schedule; **2.6b** reads the file back, makes the script extend it rather than rebuild, and adds the build checks (puzzle words, solvable, published shortest paths unchanged, 60 days left). Both together are well over ~200 lines.

**File format:** one line per puzzle number in order, `start target moves`, e.g. `cold warm 4`. Lowercase, single spaces, LF, a newline at the end, no header, like the word lists. Line N is puzzle #N, so 2.4 needs only `getPuzzleNumber`.

## Rules protected
- Same date, same puzzle; the same seed builds the same schedule (D5, D24)
- Published dates never change: extending keeps every existing puzzle as it is (D24)
- The shortest path is inside the requested range, D16's suggested 4–6 moves until 2.3 (D16, D27)
- Word length is a parameter (D4)
- **New, D30 (D24 left it to 2.6):** a word that was a start or target is neither again for the next `daysBeforeWordRepeats` puzzles, counting the existing schedule. The script uses 90 (365 at the human stop, cut at PR review); 0 turns the rule off. It may still appear in a path.

## Acceptance criteria
- builds one puzzle for each number up to the last puzzle number
- every scheduled puzzle's shortest path is within the requested range
- records each puzzle's shortest path moves
- builds puzzles of the requested word length
- keeps every existing puzzle unchanged when extending
- adds puzzles after the existing ones up to the last puzzle number
- leaves a schedule that already reaches the last puzzle number as it is
- the same seed builds the same schedule
- extending gives the same puzzles as building the whole schedule at once
- gives different puzzle numbers different puzzles
- never uses a start or target word again within the repeat window
- counts the existing schedule's last puzzles in the repeat window
- uses a word again once the repeat window has passed
- reports the puzzle number that has no puzzle in range
- writes one line per puzzle, in order, as start, target and moves
- writes an empty file for an empty schedule

## What I'm least sure of
- **Storing the shortest path's moves.** D24 says par isn't stored, and the app still works it out (1.10). The moves are stored only so 2.6b's check can see that a list change altered a published date's shortest path; without them it has nothing to compare with. The app ignores the number. If you read D24 as "store nothing but words", 2.6b needs another baseline (e.g. the file at the last release), which is harder.
- **Seed per puzzle = `scheduleSeed + puzzleNumber`.** Each puzzle's seed depends only on its number, so extending later gives the same puzzles a full rebuild would, and a list change only affects the dates it touches. Adjacent seeds are well mixed by Mulberry32 (2.1). Hashing the number first would read as more random but adds constants (no magic numbers). **Changed at PR review:** the seed is now a hash of `scheduleSeed` and the number (MurmurHash3's finaliser, constants named), so a seed one higher gives unrelated puzzles rather than shifting dates by a day (review A3).
- **A 365-day repeat window.** Measured on the real lists with seed 2026 and 4–6 moves: with no rule, a year uses 632 different words for its 730 starts and targets, and 12 dates reuse a word from the 30 days before. With 365 days, all 730 are different, no date fails, and it's no slower (34 s against 38 s, generation only). A year holds 28% of the puzzle words back by its end. A narrower range from 2.3 leaves fewer pairs; if a date then fails, the error gives its number, and a shorter window (e.g. 90) is the fallback. One cost: each date now depends on the ones before it. Dates already in the file are kept, so a hand edit to a published date (D24) changes no other date, but its new words could repeat within the window unless 2.6b checks for it. **Changed at PR review:** cut to 90 days, leaving more words for 2.3 (D30).

## Out of scope
- Reading the file, extending rather than rebuilding, the build checks: 2.6b
- The agreed range: 2.3 (D16). The launch date: 3.8. Looking up a date: 2.4. Loading the file in the app: 1.11
