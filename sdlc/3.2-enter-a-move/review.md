# 3.2 review

Two reviewers in parallel, since 3.2 is M (D29). Implementation reviewed at 0bd9e78.

**Tests changed after human review:** the invisible characters in `cleanUpTypedWord.test.ts` and in "plays a word with a zero-width space in it" are now written as escapes (everything 1). Four tests are new: "doesn't reload the page when a word is played", "names a rejected word in lowercase, as it's compared", "removes every invisible character, not just the first" and "leaves a visible space in a word for the letters check" (breaks 1–4). No existing assertion changed.

## Everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

1. **should fix** The invisible characters in the tests are raw characters, so `"co​rd"` looks like `"cord"`, and an editor could drop one without anyone noticing (`cleanUpTypedWord.test.ts`, all three tests; `App.test.tsx`, "plays a word with a zero-width space in it"). Write them as escapes. — *Response:* fixed: `​`, `﻿` and `­`, with a comment saying why.
2. **note** An empty submission after a rejection leaves the old reason on screen. Carry to 3.6a. — *Response:* carried forward to 3.6a's backlog entry.
3. **note** The same rejection twice in a row doesn't change the status text, so a screen reader may not announce it again. — *Response:* carried forward to 3.6a, whose "until a letter is changed" clearing mostly fixes it.
4. **note** After a win, `c0rd` gets "Use letters only." instead of "The game is over.", since the letters check runs first. Carry to 3.5. — *Response:* carried forward to 3.5's backlog entry.
5. **nit** `gameResult.ok && gameDataResult.ok` reads as two conditions, but the second is always true when the first is. — *Response:* fixed: a comment says it's there for TypeScript.
6. **nit** `normalised` holds a result object, not a word; the `not-letters` branch passes the raw `typedWord`, which the message doesn't use. — *Response:* renamed to `normaliseResult`, after its type. The `not-letters` call is unchanged: the switch keeps every message in one place, and that case doesn't show the word.
7. **note** The PR description must say why `@testing-library/user-event` was added. — *Response:* it does.

**Notes:** search runs once and `today` is fixed at mount · awkward input (spaces, `COLT`, non-breaking and inner spaces, combining accents, full-width letters, ZWJ, word joiner, LRM, tag characters, only-invisible input) behaves · Enter on the prefilled start word gives "Change exactly one letter." · tests are AAA with one Act; the game-over test also guards the repeat check · naming reads well · the switch is exhaustive · least-sure list: empty submission fine (see 2), wording clear, `İ` the right call, user-event justified.

## Breaks

**Reviewer:** independent agent, fresh context, focus: breaks · **Verdict:** approve with changes

34 breaks on `src/ui/App.tsx` and `src/ui/cleanUpTypedWord.ts`; 29 red, 5 green.

1. **should fix** Deleting `event.preventDefault()` leaves every test green, since jsdom doesn't navigate; in a browser each move would reload the page and reset the game. — *Response:* fixed: "doesn't reload the page when a word is played" checks `fireEvent.submit` reports the default as prevented.
2. **nit** Passing the raw `typedWord` to the rejection message leaves every test green, since every rejected-word test types lowercase. — *Response:* fixed: "names a rejected word in lowercase, as it's compared" types `COLT`.
3. **nit** Dropping the `g` flag from `cleanUpTypedWord`'s pattern leaves every test green. — *Response:* fixed: "removes every invisible character, not just the first".
4. **nit** Widening the pattern to strip spaces and punctuation leaves every test green, so `co rd` would play as `cord` (against 1.1). — *Response:* fixed: "leaves a visible space in a word for the letters check".
5. **note** Passing the cleaned but not normalised word to `applyMove` can't be caught, since `checkMove` trims and lowercases too. — *Response:* not changed; case-insensitivity is covered in core (1.5) and by the capitals test here.

**Notes:** an empty word passed on to `applyMove` crashes the run, so the early return is load-bearing · awkward input through the page is fine · the run-once search wasn't broken, as no test can see it · `breaks.json` holds all 34.

### Reviewer's own break-the-code checks
- Moves checked against the puzzle words (D8) → red, 10 tests
- Wrong, forgotten or stale game state; move count off by one → red
- `cleanUpTypedWord` skipped, or only zero-width spaces removed, or nothing removed → red
- Input not prefilled, reset to start, raw word kept after a move, cleared after a rejection → red
- Reason not cleared after a valid move; not-letters guard deleted or given the wrong message; empty submission shown a message or passed on → red
- Length message hard-coded to 4 (D4); messages swapped or changed → red
- `role="status"` removed or rendered only with text; label, Play, submit type, handler or `onChange` broken → red
- `preventDefault` deleted; raw word in message; no `g` flag; spaces and punctuation stripped → **green** (findings 1–4)
- Cleaned word passed to `applyMove` → **green**, can't be caught (finding 5)

## Breaks re-run after fixes
`npm run break -- sdlc/3.2-enter-a-move/breaks.json`: `34 breaks: 0 not applied, 1 all green.` Breaks 1–4's gaps are now red; the green one is "Skip lowercase", finding 5, which no test can catch. Ten `find`s named `normalised` and were updated to `normaliseResult` after the rename.
