# 2.6b review

Two reviewers in parallel (M chunk, D29), on `025c7e6..6737b66`. Fixes are in the commit that adds this record.

**Tests changed after human review:** "reads each line as a puzzle, in order" now has two-digit moves (`cord ward 12`, B3); "rejects moves that aren't a whole number above zero" is renamed "rejects moves of zero", since it only tries `0` (B2). Five tests added: negative moves, moves that aren't a whole number, a leading zero, parts not separated by a single space, and the first unreadable line when the last has no newline too.

## Review G: everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

1. **should fix** No test shows a moves count with a leading zero is rejected. `cold warm 04` is rejected today, but `Number("04")` is 4, so a looser regex would write it back as `cold warm 4`, changing a published line (D24). — *Response:* fixed: `rejects moves with a leading zero` (same as B1).
2. **nit** A last line with no newline is reported before an earlier bad line: `"Cold warm 4\ncord ward 2"` gave line 2, though the doc comment says the first bad line is returned. — *Response:* fixed: the final-newline check now runs after the lines; `reports the first unreadable line when the last line has no newline too`.
3. **note** The reader accepts `colds warm 4` (wrong length) and `cold cold 1` (start equals target). Length is covered by 2.6c's puzzle-word check; start equals target is named by no 2.6c criterion. — *Response:* carried forward on 2.6c.
4. **note** A bad `todaysPuzzleNumber` or `puzzlesAhead` (`NaN`, `-5`, `0.5`) returns `ok` with the file unchanged. Harmless while the script hard-codes 0 and 365; matters once 3.8 computes today's number. — *Response:* carried forward on 3.8.
5. **nit** The script prints `Wrote 365 puzzles` even when it added none; the number added is what shows published lines weren't regenerated. — *Response:* fixed: it now prints `Wrote 365 puzzles to data/puzzles/schedule.txt, 0 added`. Also renamed `where` to `failedAt`, which the reviewer called a little vague.

**Notes:** every acceptance criterion has a test of the same name, AAA, hand-worked literals, none tautological · the script leaves the committed file byte-identical, rejects a capital on line 3 with exit 1 and no write, and extends a 360-line cut back to the committed 365 · the reader rejects a BOM, a trailing blank line, a lone `\n`, double, trailing and tab whitespace, non-ASCII and CRLF · 20+-digit moves read back as `1e20` (unrealistic) · naming follows CLAUDE.md · size ~112 lines of `src/` and `scripts/`, 239 of tests, over the ~200 guide, called out in the PR · the backlog split matches the intent.

## Review B: breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

1. **should fix** Moves allowing a leading zero (`0*[1-9][0-9]*`), or `\s+` between parts, leave every test green, and both would rewrite a published line on write-back (D24). — *Response:* fixed: `rejects moves with a leading zero`, `rejects parts not separated by a single space`; both breaks now red.
2. **should fix** "rejects moves that aren't a whole number above zero" tries only `0`; allowing a negative or a decimal stays green. — *Response:* fixed: renamed `rejects moves of zero`, and added `rejects negative moves` and `rejects moves that aren't a whole number`; both breaks now red.
3. **nit** Single-digit moves only (`[1-9]`) stays green; no fixture has two-digit moves. — *Response:* fixed: the reads-each-line fixture has `cord ward 12`; break now red.
4. **note** No test runs `scripts/buildSchedule.mjs` or compares the committed schedule with an extend of itself, so replacing the file read with `""` would rebuild from #1 unnoticed. — *Response:* carried forward on 2.6c, whose test on the committed files is the natural place.
5. **nit** Moves past `Number.MAX_SAFE_INTEGER` don't round-trip. — *Response:* not changed: no real schedule line reaches that; the reviewer suggests no action.

**Notes:** lint passes · 277 tests pass · only the planned files changed · the reader accepts `co warm 4` and `cold cold 4`, which is right here since word checks are 2.6c's.

## Reviewer's own break-the-code checks

31 breaks, all applied, in a scratch copy.
- Line format: no `$`, no `^`, `/i`, lowercase each line → red (extra part, Windows line ending, capital letter, unreadable line in getExtendedScheduleText)
- Moves of 0 allowed → red
- **Leading zero, negative, decimal, `\s+` separators, single-digit moves → all green** (B1–B3). Re-run after the fixes with the final-newline order (G2): all six red
- Line handling: trim, split on `\r?\n`, skip blank lines, delete or soften the final-newline guard → red
- Line numbers 0-based or off by one → red
- Wrong input: swap start and target, keep moves as a string → red
- Skip a bad line instead of rejecting it; return an empty schedule early → red
- Extending: `lastPuzzleNumber` ignoring today, ±1, or `max(today, ahead)` → red
- Extend from `[]` instead of the file; cut to today + ahead; return the input unchanged → red
- Delete the read-failure guard; swallow the extend failure → red
- `[]` on a failed read with the guard kept → green, but no behaviour change, so not a finding
- `scripts/buildSchedule.mjs` → no test runs it (B4)
