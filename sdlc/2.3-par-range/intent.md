# 2.3 Daily par range

**Intent:** fail the build when a puzzle after today's has a shortest path outside D16's range, 4–6 moves (par 6–9, D27), so a stale schedule, a hand edit or a range change can't put a puzzle of the wrong length in front of players. Generation already picks inside the range, but the script keeps every line of the file it reads (D24), so nothing so far checks lines already there.
**Signature:** `checkSchedule` takes a new option, `shortestPathMoves: { fewest, most }`, the same shape `extendSchedule` takes, and gains the reason `shortest-path-out-of-range` with `puzzleNumber`. `getExtendedScheduleText` passes its range to the check. `build:schedule` keeps `{ fewest: 4, most: 6 }`, now as D16's decided range.

## Rules protected
- Every puzzle after today's has a shortest path within the agreed range (D16, backlog 2.3); par follows from it (D27)
- Today's and earlier puzzles aren't range-checked: published dates never change (D24)
- A shortest path that changed is reported as changed, not as out of range, since the stored moves are then wrong (D24, 2.6c)

## Acceptance criteria
- rejects a puzzle after today's whose shortest path is shorter / longer than the range allows
- passes puzzles at exactly the fewest and the most moves the range allows
- leaves today's and earlier puzzles out of the range check
- range-checks the first puzzle after today's
- reports a changed shortest path as changed, not out of range
- extending checks the file's lines against the shortest-path range it is given
- the committed schedule passes the checks with the committed word lists (now with D16's range)

## What I'm least sure of
- **Range-checking only puzzles after today's.** The backlog says "every scheduled puzzle". Before launch today is #0, so that's every puzzle, and the two readings agree until 3.8. After launch, checking published dates too would mean a later change to D16 fails the build on dates that D24 says can't change. If you'd rather check every date, drop the "leaves today's and earlier" test and the check loses one condition.
- **Four existing `getExtendedScheduleText` tests change** (tests changed after earlier human review). Their file lines are 1 and 2 moves, deliberately ones generation at 4 moves wouldn't pick, and with today at #0 or #1 they'd now fail the range check before reaching what each test is about. Each gets a range of 1–4 that takes the lines in; none of them adds puzzles, so generation is unaffected. The alternative, new fixture lines at 4 moves, isn't possible: on LADDER only `cold`–`warm` is 4 apart.
- **No regeneration.** The committed schedule was built with 4–6 already (97 puzzles of 4 moves, 159 of 5, 109 of 6), so 2.3 leaves it as it is. Rebuilding would give the same file.

**Also:** the range lives in two places, `build:schedule` and the committed-files test, as D30's 90 and D24's 60 already do. A shared constant would be a separate change.

## Out of scope
- Changing D16 after launch: the script keeps the file's unpublished lines, so a new range then needs those lines dropped first. Nothing does that yet; it's a question for whoever next changes D16.
- Choosing a range by difficulty rather than length (D27, Ideas for later).
