# 2.5 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

The code does what the intent says and nothing outside it; files match the plan; every acceptance criterion has a test; lint, tests and coverage pass. Seven breaks left every test green: two are real gaps (findings 1, 2), the rest are checks that duplicate another (3–5).

## Findings
1. **should fix** Nothing catches a fixed year length: no test crosses a leap day into the next year. A `(year − 1970) × 365 + day of year` count passed every test. Suggested launch 2028-01-01 → 2029-01-01 is #367, and fix the plan table. — *Response:* fixed. New test `counts a leap year as 366 days` (2028-01-01 → 2029-01-01 is #367); plan table corrected. **Test added after human review.**
2. **should fix** No test date is in summer time, so nothing backs "UTC avoids clock changes". Local `new Date(…)` passed every test; under Europe/London, 2027-03-01 → 2027-04-01 gave `invalid-date`. — *Response:* fixed. New test `counts whole days across a change to summer time` (2027-01-01 → 2027-07-01 is #182), with a comment that it only catches the break on a device whose timezone has summer time, so a UTC-only CI passes either way. **Test added after human review.**
3. **nit** The `Number.isInteger` check never changes a result; the round trip already rejects fractions, `NaN` and `Infinity`. — *Response:* fixed. Check removed; the `getDayCount` comment now says the round trip catches fractions and rollovers.
4. **note** Deleting any one round-trip comparison leaves tests green; the year comparison matters only for years 0–99, which no test covers. — *Response:* not changed. The intent already records years 0–99 as a side effect with no real puzzle date affected; a test would protect a `Date.UTC` quirk, not a game rule.
5. **nit** A "same date returns #1" shortcut before validation passes every test. — *Response:* fixed. New test `rejects an invalid date that is the same as the launch date` (both 2027-02-29). **Test added after human review.**

**Notes:**
- Awkward input checked and correct: day 0, month 0, day −1, 31 April, `NaN`, `Infinity`, fractional year and month, a string day, year 300000, 29 February 2100 (invalid) and 2000 (valid), 2127-01-01 (#36525), 29 March 2027 (#88).
- Names read well; `get…` with a result object is explained in the intent and agreed.
- Tests use no shared helpers; comments show the hand count.

## Reviewer's own break-the-code checks
- Count from 0 → red: all six counting tests.
- `< 0` → `< -1`, or before-launch guard deleted → red: the day before launch has no puzzle number.
- `< 0` → `<= 0` → red: the launch date is puzzle #1.
- Subtract the wrong way, or launch compared with itself → red: five counting tests and the day before launch.
- Month not shifted to 0-based → red: all seven counting and before-launch tests.
- Compare month and day only → red: counts across a year boundary.
- Date's validity guard deleted → red: the three date rejections and invalid-date-before-launch.
- Launch's validity guard deleted → red: rejects an invalid launch date.
- Whole round trip deleted → red: the three rejections and invalid-date-before-launch.
- Day truncated with `Math.trunc` before checking → red: rejects a day that isn't a whole number.
- Before-launch checked before validity → red: the three rejections and invalid-date-before-launch.
- Fixed 365-day year → **all green** (finding 1).
- Local time instead of UTC → **all green** under Europe/London (finding 2).
- Integer check deleted → **all green** (finding 3).
- One round-trip comparison deleted at a time → **all green** each (finding 4).
- Same date returns #1 before validation → **all green** (finding 5).
