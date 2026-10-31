# 1.9 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes → all findings answered, see responses

The reviewer confirmed that the result is the alphabetically first shortest path. They found the files match the plan, the naming follows `CLAUDE.md`, and every acceptance criterion has a test. They ran awkward inputs (`""`, `"co ld"`, `"é"`, `"cold "`, a mixed-case dictionary) and got the results the intent says.

**Tests changed after human review** (all four respond to findings below; each fix was confirmed to turn the reviewer's break red):
- "different-lengths": `colds` removed from the fixture, so the length reason has to win over the dictionary reason (finding 1)
- New: "invalid-word, when the target is empty" (finding 2)
- New: "not-a-word, when start equals target but is not a word" (finding 3)
- "unreachable": `card` added, so the fixture has a loop (finding 4)

## Findings
1. **should fix** The order reasons are checked in has no test. Moving the dictionary check before the length check left every test green, and `colx → colds` would then return `not-a-word`. — *Response:* **Fixed.** The `different-lengths` test no longer lists `colds`, so both reasons apply to it and the length reason must win. The reviewer's break now turns it red. `invalid-word` coming first is already forced: with an invalid start or target there's no word to measure.
2. **should fix** No test passes an invalid target or an empty string. Dropping `|| !normalisedTarget.ok` left every test green. — *Response:* **Fixed.** Added "returns no path, with reason invalid-word, when the target is empty" (`cold → ""`). The reviewer's break now turns it red.
3. **should fix** Start equals target, when the word isn't in the dictionary, has no test. An early return of `[start]` placed before the dictionary check left every test green. — *Response:* **Fixed.** Added "returns no path, with reason not-a-word, when start equals target but is not a word" (`colt → colt`, only `cold` listed). The reviewer's break now turns it red.
4. **nit** The `unreachable` fixture has no loop, so a solver that never records the words it has reached still passes. — *Response:* **Fixed.** The fixture is now `cold, cord, card, warm`. With `reachedWords.add` removed, the search goes back and forth between `cord` and `card` until the test worker runs out of memory and crashes, after about 5 s. Run by hand, because of finding 7. Stryker found the same gap independently (see `plan.md`).
5. **note** The speed estimate is low. The committed code took about 306 ms on the 4,096-word synthetic list, against the prototype's 120 ms, so about 200 ms for 3,300 words. — *Response:* **Confirmed and corrected.** I re-measured the committed code: 4,096 words took 308–315 ms, and 2,401 words took 107–112 ms. That's N², as expected, so about 200 ms for 3,300 words on this PC, and maybe 0.6–1 s on a phone in the worst case. The intent's number came from a prototype that didn't build a new path for each word. The 6.1 *Carried forward* line now gives about 200 ms and says to speed up `getWordsOneLetterAway` if 6.1's measurement is too slow for loading a game, not only for 2.2.
6. **note** 258 lines of code, over the ~200 guide; flagged in intent choice 6. — *Response:* Noted. With the fixes the chunk is now 60 lines of source and about 220 of tests. It's still one function, so it isn't split.
7. **note** `scripts/break.mjs` reported ALL GREEN for a run where the test worker crashed. — *Response:* **Not changed in 1.9.** It's a process tool, so the fix goes on its own branch, proposed separately. Until then, a break that can hang or crash the run should be checked by hand, as finding 4's was.

## Reviewer's own break-the-code checks
- Dictionary checked before length → all green *(finding 1; now red)*
- Early return of `[start]` before the dictionary check → all green *(finding 3; now red)*
- Invalid target not checked → all green at runtime; `tsc` catches this exact edit *(finding 2; now red)*
- Reached words not recorded → all green *(finding 4; now red: the worker crashes)*
- Target matched only when a word is queued, so the start is never matched → red: 10 tests
- Search stops after 3 moves → red: "fewest moves", the step invariant, "starts at the start word…"
- Target compared with the raw input → red: the case and spaces tests
