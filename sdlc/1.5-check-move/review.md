# 1.5 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes → all findings addressed, see responses

## Findings
1. **should fix** No test for a repeated word typed in a different case. Changing the repeat check to `chain.includes(nextWord.trim())` left all tests green. — *Response:* **Fixed.** Added `rejects a repeated word typed in a different case…` (`CORD`); it goes red on that break.
2. **should fix** No test rejects a word one letter from an earlier chain word but not the current one. Accepting a change from the start word *or* the current word left all tests green. — *Response:* **Fixed.** Added `rejects a word one letter from an earlier word but not the last one…` (`colt` after `cold, cord`); it goes red on that break.
3. **should fix** Every test uses 4-letter words, so hard-coding the length to 4 left all tests green, against D4. — *Response:* **Fixed.** Added `accepts a move between words of another length` (`cat → cot`); it goes red on that break.
4. **nit** The local `word` reads ambiguously beside `nextWord` and `currentWord`. — *Response:* **Fixed.** Renamed to `normalisedNextWord`.
5. **note** An empty chain gives reasons that make no sense to a player. Out of scope here; 1.6 should test that a chain is never empty. — *Response:* Agreed; will carry into the 1.6 intent.
6. **note** Awkward input (whitespace, accents, `İ`, zero-width space, uppercase chain) all gives sensible reasons. `İ` and zero-width spaces report `wrong-length` for what looks like four letters. — *Response:* Accepted; input clean-up belongs in the UI (3.2).
7. **note** Checking repeats before the dictionary changes no result, as intent.md says. — *Response:* Noted.

## Reviewer's own break-the-code checks
- Repeat check ignores case → all green *(finding 1; now red after fix)*
- Length hard-coded to 4 → all green *(finding 3; now red after fix)*
- Accept a change from the start word or the current word → all green *(finding 2; now red after fix)*
- Repeat check skips the start word → red: `rejects the start word…`
- Return the word untrimmed → red: `returns the accepted word in lowercase…`
- No trimming at all → red: the same test
