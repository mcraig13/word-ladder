# 2.3 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The change is small and does what the intent says. The range check runs after the shortest-path-changed check and only on puzzles after today's, and `getExtendedScheduleText` passes the same range that generation uses. The changed files match the plan. Since the human stop (`a676e1e..HEAD`), only the three planned source and script files and `plan.md` changed. No test changed. Tests follow AAA, have one Act, use the five-word LADDER fixture, and give hand-worked literals with a comment explaining each. Every acceptance criterion has a test. 14 of 15 breaks went red.

## Findings
1. **nit** Nothing tests the NaN guard. In `src/puzzles/checkSchedule.ts`, the comment on the range check says it is "Written so a NaN end fails, as the puzzles-ahead check is (2.6b review G4)", and `plan.md`'s self-check says the same. Break 12 rewrote the check in its NaN-unsafe form, `(shortestPathMoves < fewest || shortestPathMoves > most)`, and every test stayed green. The puzzles-ahead check it points to has a test; this one has none. Either add a test such as "rejects a puzzle after today's when an end of the range isn't a number", or drop the claim from the comment and the self-check. — *Response:* fixed. **Test added after human review:** `rejects a puzzle after today's when an end of the range isn't a number` in `tests/puzzles/checkSchedule.test.ts`. The NaN-unsafe break now goes red on it.
2. **nit** The edited header comment in `scripts/buildSchedule.mjs` has an odd wrap: line 16 is 100 characters while the lines around it wrap at about 78. — *Response:* fixed, rewrapped.

**Notes:**
- Scope matches the intent; `isPublished` is `index + 1 <= todaysPuzzleNumber`, and the reason union gains `shortest-path-out-of-range` with `puzzleNumber`.
- The committed schedule is all 4–6 moves (97 / 159 / 109), so not regenerating it is right.
- The four changed `getExtendedScheduleText` tests only gain `RANGE_FOR_EXISTING_LINES`, as the intent says.
- Awkward input: an inverted range, NaN in either end and a fractional `fewest` all fail as out of range; a `todaysPuzzleNumber` of −1, 1.5 or NaN range-checks every unpublished puzzle; a today beyond the schedule's end reports `too-few-puzzles-ahead`.
- Naming: `isPublished` and `RANGE_FOR_EXISTING_LINES` read well.
- The backlog entry for 2.3 still says "Regenerate the schedule"; the intent explains why not, and the entry moves to `backlog-done.md` at merge.
- Lint clean; 324 of 324 tests passed in the reviewer's scratch copy.

## Reviewer's own break-the-code checks
15 breaks with `npm run break` in a scratch copy, all applied.
- Change in place: `>= fewest` → `> fewest`, `<= most` → `< most`, comparing `path.length` instead of stored moves → red, many tests, including the exact-ends test and the committed-schedule test.
- Delete a guard: the fewest guard, the most guard, the whole range check → red (the shorter / longer / first-after-today's / extending range tests).
- Off by one on published: `index + 1 < today` → red (`leaves today's and earlier puzzles out of the range check` and three others); `index <= today` → red (`range-checks the first puzzle after today's`, the extending range test); delete `!isPublished` → red.
- Reorder: range check before the changed check, or before the shortest-path search → red (`reports a changed shortest path as changed, not out of range`, `rejects a puzzle whose shortest path has fewer moves than stored`).
- Return early: published puzzles skip every check → red (`extending reports a line already in the file that fails the checks`).
- Use the wrong input: `getExtendedScheduleText` passes `{ fewest: 0, most: 99 }` → red (the extending range test); passes `todaysPuzzleNumber + 1` → red (four extending tests).
- NaN-unsafe form of the range comparison → **all green** (finding 1); red after the fix.
