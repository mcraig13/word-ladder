# 2.6b Read back and extend the schedule

**Intent:** read `data/puzzles/schedule.txt` back and make `build:schedule` extend it rather than rebuild from #1, so after launch a rebuild never touches a published date (D24). Before launch, deleting the file and running the script rebuilds it, as 2.3 needs.
**Signature:** `createScheduleFromText(text)` → `{ ok: true, schedule }` or `{ ok: false, reason: "unreadable-line", lineNumber }`. `getExtendedScheduleText(text, { ...extendSchedule's options without lastPuzzleNumber, todaysPuzzleNumber, puzzlesAhead })` → `{ ok: true, scheduleText }`, or the failure from reading (`unreadable-line`, `lineNumber`) or extending (`no-puzzle-in-range`, `puzzleNumber`). The script reads the file (empty if missing), writes the new text, or prints the failure and writes nothing.

**Split (proposed, CLAUDE.md size limit):** 2.6b as backlogged is about 550 lines with tests. This chunk reads and extends (about 330); a new **2.6c** adds the build checks: puzzle words, solvable, published shortest paths unchanged, 60 days left, and the repeat window after a hand edit (about 250). 2.6c needs this chunk's reader. 2.3 needs only this chunk.

## Rules protected
- Published dates never change: every line already in the file is kept byte for byte, and new lines go after it (D24)
- About a year ahead: the schedule reaches `puzzlesAhead` puzzles after today's (D24). Before launch today is #0, so 365 ahead is #1–#365, the file as 2.6a built it
- The file format from 2.6a: `start target moves`, lowercase, single spaces, LF, a newline after each line. A line that doesn't match is rejected with its line number, not guessed at (CLAUDE.md, Conventions: a result with a reason)

## Acceptance criteria
- reads each line as a puzzle, in order
- reads an empty file as an empty schedule
- rejects a line with a capital letter, giving its line number
- rejects a line with a part missing / with an extra part
- rejects moves that aren't a whole number above zero
- rejects a blank line / a Windows line ending / a last line with no newline
- reads the committed schedule file back
- extending the schedule adds puzzles up to the requested number ahead of today's
- keeps the file's existing lines exactly as they are
- leaves a file that already reaches far enough ahead as it is
- builds a schedule from an empty file
- reports an unreadable line / the puzzle number with no puzzle in range

## What I'm least sure of
- **Rejecting, not lowercasing, a capitalised line** (carried forward, A2/B4). Lowercasing would quietly rewrite a published line, and the file is only ever written lowercase, so a capital means a hand edit went wrong. Rejecting the whole format strictly (blank lines, CRLF, no final newline) also keeps the new text a pure append. If you'd rather hand edits be forgiving, lowercase and trim instead, but then the written file differs from the one read.
- **Today is #0 before launch, and the script hard-codes it until 3.8 sets the launch date.** `puzzlesAhead` counts puzzles after today's, so on launch day the first run adds one line (#366). Passing dates instead of a number would let a test cover the mapping, at the cost of a launch date that doesn't exist yet.
- **The split itself.** The checks could ride along here as one ~550-line PR, as 2.6a did at 520. I split because the reader is useful alone (2.3 rebuilds with it) and each half reviews more easily.

## Out of scope
- The build checks and the carried-forward lines on them (A1, A6, B1): 2.6c. The launch date and today's puzzle number from the clock: 3.8. Loading the file in the app: 1.11
