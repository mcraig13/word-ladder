# 1.6 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes → all findings addressed, see responses

## Findings
1. **should fix** Nothing checks that `applyMove` stores the played word lowercase: appending the raw input left all tests green. — *Response:* **Fixed.** Added `stores the played word in lowercase without surrounding spaces` (` CORD `); it goes red on that break.
2. **should fix** Nothing checks that `start` and `target` carry over: overwriting either in the returned game left all tests green. — *Response:* **Fixed.** `applying a valid move extends the chain` now asserts the whole returned game; it goes red on both breaks.
3. **nit** The win check on trimmed input wasn't tested. — *Response:* **Fixed.** The case test now plays ` WARM ` and is renamed `…in a different case or with spaces`; it goes red on an untrimmed win check.
4. **nit** `an invalid move leaves the chain unchanged` asserted only on the given game, so it was really a second purity test. — *Response:* **Fixed.** It now also asserts the result is `not-a-word`, still one Act.
5. **note** About 330 lines of src and tests, over the ~200 guideline. — *Response:* Stated in the PR description; mostly tests, as in 1.5.
6. **note** Awkward input all handled; a hand-built `Game` with an empty chain gives `wrong-length`, and the type can't prevent it. — *Response:* Agreed; restoring a saved game must check this. Will carry into the 4.3 intent.

## Reviewer's own break-the-code checks
- Append the raw `nextWord` → all green *(finding 1; now red after fix)*
- Set `start: move.word` → all green *(finding 2; now red after fix)*
- Set `target: move.word` → all green *(finding 2; now red after fix)*
- Win check on untrimmed input → all green *(finding 3; now red after fix)*
- Rebuild the chain as start plus the new word → red: `the game is won when the chain reaches the target`
- Game-over check after `checkMove` → red: `reports game-over before any other reason`
- `createGame` checks length before validity → red: `…a target that is not a word`
- `createGame` stores the chain's start in uppercase → red: `a new game's chain…`, `stores the start and target…`
- `createGame` stores raw start and target → red: `stores the start and target…`
