# 1.4 review

**Reviewer:** independent agent, fresh context · **Verdict:** changes needed → all findings addressed, see responses

## Findings
1. **should fix** Two reviewer breaks left all 7 tests green: accepting two changed letters, and ignoring letter position. No fixture word was two letters from `cold`, or shared its letters in different positions, so the core move rule wasn't actually protected here, only inherited from `areWordsOneLetterApart`. That matters for 1.9, where a faster lookup could bypass it. Suggested a `card` / `load` fixture. — *Response:* **Fixed.** Added `does not include a word with two letters changed` (`card`) and `does not include a word that changes one letter but moves the others` (`load`). Both reviewer breaks now turn tests red.
2. **should fix** The input word wasn't normalised: `"cold "` returned `["colds"]`, `" cold"` returned `["scold"]`, `"co1d"` returned `["cold", "cord"]`, which breaks the no-adding-letters rule the chunk protects. — *Response:* **Fixed.** The function now runs `normaliseWord` first and returns nothing for invalid input, matching `containsWord`. Added `ignores spaces around the word it is given` and `returns nothing when given something that is not a word`; both fail on the original code.
3. **should fix** The implementation commit also changed `CLAUDE.md` (the self-review step), which is outside this chunk's scope. — *Response:* **Fixed.** Removed from the 1.4 commit. That change, and the new `sdlc/README.md`, go on their own branch as a process change.
4. **nit** `does not include the word itself` and `only returns words that are in the dictionary` had identical fixtures. — *Response:* **Fixed.** The "itself" test now uses `bold, cold` → `bold`.
5. **note** A word not in the dictionary still gets moves (`colt` → `cold`). — *Response:* **Documented** in `intent.md` (out of scope) and the doc comment. No behaviour change: callers pass chain words that `checkMove` has already accepted.
6. **note** Scope, acceptance criteria coverage, AAA, naming, empty input, type-check and lint all checked out. — *Response:* Noted.

## Reviewer's own break-the-code checks
- Accept one **or two** changed letters → all 7 green *(finding 1; now red after fix)*
- Ignore position → all 7 green *(finding 1; now red after fix)*
- Allow adding or removing a letter → red: `ignores words that are a letter longer or shorter`
- Return only the first match → red: `returns every…`, `returns words in alphabetical order…`
- Never allow the first letter to change → red: the same two tests
