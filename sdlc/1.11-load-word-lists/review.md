# 1.11 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve

The change does what the intent says and stays within it. The diff (`origin/main...HEAD`) touches exactly the files `plan.md` lists: two new files in `src/puzzles/`, two test files and the chunk's records. There's no UI wiring and no new dependency. Every acceptance criterion has a test under its exact name. The tests follow AAA with one Act each, use small fixtures in which accepted and puzzle texts differ (`cord` is only accepted, per D31), and use hand-worked literals. All 20 breaks went red.

## Findings
1. **note** Three other places split a list file on `\n` and pass it to `createDictionaryFromWords` the same way, and could call `createGameDataFromText` instead: `scripts/buildSchedule.mjs:46`, `tests/puzzles/checkSchedule.scowl.test.ts:27-28` and `tests/puzzles/generatePuzzle.scowl.test.ts:16-17`. Harmless now, but they could drift apart if the list format changes. Could be carried forward to 7.1's cleanup. — *Response:* not changed here (outside the plan's files); carried forward to 7.1 in `backlog.md`.
2. **note** `createGameDataFromText` doesn't check that each schedule line's start and target are puzzle words, or that its move count is right: `scheduleText: "cold zzzz 4\n"` with lists that don't contain `zzzz` returns `ok: true`. Covered for the committed schedule by `checkSchedule.scowl.test.ts` in CI, so not a bug, but 3.1 should not assume `ok: true` means the schedule matches the lists. — *Response:* not changed: checking word list and schedule contents is out of scope (intent) and done in CI by 2.6c. Carried forward to 3.1 in `backlog.md`.

**Notes:**
- `npm run lint` passes: tsc, ESLint and "All matched files use Prettier code style!".
- Full suite not run on its own; every break run went through the whole suite with only the expected tests red.
- Awkward input behaves correctly: CRLF and upper-case lists load as lowercase words; a list with no final newline keeps its last word; empty schedule or lists give `ok: true` with empty values; a CRLF schedule, or one with no final newline, gives `unreadable-schedule-line` on line 1.
- Least-sure points: returning a result fits the conventions and D33's coverage rule; keeping puzzle words is what the backlog asks for; leaving `App` wiring to 3.1 keeps scope.
- Only the accepted list's last word is tested directly; dropping the puzzle list's last word is still caught by `toEqual(["cold","warm"])`.
- The bundled "every puzzle word is also an accepted word" test overlaps `getWordLists.scowl.test.ts:90`, but checks the data through the loader.
- `breaks.json` formatted with Prettier to keep `npm run lint` green.

## Reviewer's own break-the-code checks
Saved in `sdlc/1.11-load-word-lists/breaks.json` (20 breaks; all ran, all red).

- Wrong input, accepted and puzzle words (D8): accepted from the puzzle text, puzzle from the accepted text, both dictionaries swapped → red (fixture tests, bundled counts, "every puzzle word…").
- Change in place, list splitting (6.1b): either list drops its last word, accepted split on `\r\n` → red.
- Delete a guard / change in place, schedule failure (2.6b): guard deleted, line number off by one, inner reason passed on → red ("an unreadable schedule line…").
- Wrong input / reorder, schedule (D24): read from the accepted text, reversed, last or first puzzle dropped → red.
- Wrong input, bundling (D21): either import pointed at the other file, texts swapped → red (bundled counts, "every puzzle word…").
- Not applicable: return early, forget state, reordering the schedule check against dictionary building (dictionaries can't fail).

No production logic changed in response, so the breaks weren't re-run.
