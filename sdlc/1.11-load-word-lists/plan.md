# 1.11 plan

## Approach
Two small files in `src/puzzles/`, split so the logic is tested with fixtures and the wiring with the real files:

- `createGameDataFromText` splits each word list on `\n` and passes the lines to `createDictionaryFromWords`, which skips the empty piece after the last newline (1.2 ignores non-words). It reads the schedule with `createScheduleFromText` and returns its failure unchanged as `unreadable-schedule-line`, with the line number; otherwise `{ ok: true, gameData }`. Exports `GameData` and `CreateGameDataResult` for 3.1.
- `getBundledGameData` imports the three files with `?raw` and calls `createGameDataFromText` once per call. No branches, so it needs no test of its own beyond the real-file tests; 3.1 calls it once at start.

`?raw` is already used by the `.scowl` tests and typed by `vite/client` in `tsconfig.json`. `.gitattributes` keeps the files LF, so splitting on `\n` matches the format (6.1b, carried forward). No new dependencies.

## Files
- `src/puzzles/createGameDataFromText.ts` — new
- `src/puzzles/getBundledGameData.ts` — new
- `tests/puzzles/createGameDataFromText.test.ts` — new, fixtures
- `tests/puzzles/getBundledGameData.test.ts` — new, the committed files
- `sdlc/1.11-load-word-lists/` — these records

## Tests
| Test | Rule |
|---|---|
| **createGameDataFromText** | |
| the accepted words include a word that is not a puzzle word | Moves are checked against the accepted words (D8); catches building both from the puzzle text |
| the puzzle words leave out a word that is only an accepted word | Start and target come from the puzzle words (D8); catches building both from the accepted text, or swapping them |
| reads the last word in a list, before the final newline | The file format ends with a newline (6.1b); catches dropping the last line instead of the empty piece |
| reads the schedule text as the schedule, line N as puzzle #N | Line N is puzzle #N (D24); catches reading the wrong text or reordering |
| an unreadable schedule line gives no game data, with its line number | A bad schedule is reported, not guessed at (2.6b); catches ignoring the failure |
| **getBundledGameData** | |
| every puzzle word is also an accepted word | Every puzzle is solvable (D8) |
| the bundled accepted words are the words in accepted.txt, counted by line | The app loads the committed file; catches importing the wrong file |
| the bundled puzzle words are the words in puzzle.txt, counted by line | As above, and catches swapping the two files |
| the bundled schedule has one puzzle for each line of schedule.txt | The whole schedule is loaded (D24) |
| the bundled accepted words include every word in the rules' example | `COLD → CORD → CARD → WARD → WARM` is playable (CLAUDE.md); a check with words a reader can see |

The bundled tests use counts and the rules' example rather than the first schedule line, so they stay true when 6.2 and 6.3 rebuild the lists and schedule.

## Self-check
