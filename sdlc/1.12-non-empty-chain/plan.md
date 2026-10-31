# 1.12 plan

## Approach
- Export `Chain = readonly [startWord: string, ...laterWords: string[]]` from `createGame.ts`, and type `Game.chain` with it. `createGame`'s `[normalisedStart.word]` already fits.
- `checkMove` takes `Chain`. It splits off the start word and uses `laterWords.at(-1) ?? startWord` as the current word, so the `?? ""` fallback and the "must contain the start word" comment go.
- `applyMove` needs no code change: `[...game.chain, move.word]` is still a `Chain`.
- `undoLastMove` returns `[startWord, ...laterWords.slice(0, -1)]`, with no cast.
- Branch threshold goes to 100: `vite.config.ts` and its comment, plus a note on D20's status line.
- Update the 4.3 *Carried forward* line as worded in intent choice 6.

## Files
- `src/core/createGame.ts`: add `Chain` and use it for `Game.chain`
- `src/core/checkMove.ts`: take `Chain`, new current-word line
- `src/core/undoLastMove.ts`: rebuild the chain from its parts
- `tests/core/checkMove.test.ts`: annotate 18 chains as `Chain`, plus one import (types only)
- `vite.config.ts`, `DECISIONS.md` (D20 status line), `backlog.md` (1.12 entry, 4.3 line)
- `sdlc/1.12-non-empty-chain/`: these records

## Tests
No new tests; behaviour is unchanged. These existing tests cover the changed lines and would go red if those lines broke a rule:

| Test | Covers | Rule |
|---|---|---|
| checkMove: every test with a one-word chain, e.g. "accepts a valid one-letter change…" | `?? startWord` side: the current word is the start word before any move | The chain begins with the start word (1.6) |
| checkMove: "checks the move from the last word in the chain, not the start word" | `laterWords.at(-1)` side | Moves are checked from the last word (CLAUDE.md, Moves) |
| checkMove: "rejects a word used earlier in the chain…", "rejects the start word…" | The repeat check still sees the whole chain, start word included | Repeated words are rejected (D13) |
| undoLastMove: "removes the last word from the chain" | Rebuilt chain keeps start and earlier words | Undo removes only the last word (D12) |
| undoLastMove: "can undo the first move back to the start word" | `laterWords.slice` to empty leaves the start word | Undo cannot go past the start word (D12) |

**Changed test file:** `tests/core/checkMove.test.ts`. `const chain = [...]` becomes `const chain: Chain = [...]` in 18 tests. The words, Acts and assertions are unchanged. Until `Chain` exists, `npm run lint` fails to type-check, and the tests still pass at runtime.

## Self-review
The diff matches the intent and touches only the files listed. Lint passes; 87 tests pass; coverage is 100% on all four measures, with 46/46 branches. Every break was restored, and no test needed strengthening.

Behaviour breaks (`npm run break`):
- Current word is always the start word → red: "checks the move from the last word…", "rejects the start word…", "an undone word can be played again", and 4 more
- Current word is the first word after the start (`at(0)`) → red: "rejects a word used earlier in the chain…", "the game is won when the chain reaches the target", and 3 more
- Repeat check skips the start word → red: "rejects the start word with reason repeated-word"
- Undo drops the start word → red: "removes the last word…", "can undo the first move…", "an undone word…"
- Undo removes the first move instead of the last → red: "removes the last word…", "an undone word…"
- Undo removes nothing → red: "removes the last word…", "can undo the first move…", "an undone word…"

Type breaks (`tsc --noEmit`, by hand):
- `Chain` widened to `readonly string[]` → error in `checkMove.ts`: `currentWord` is possibly undefined
- `createGame` starts with `chain: []` → error: `[]` is not a `Chain`
- Undo goes back to `game.chain.slice(0, -1)` → error: `string[]` is not a `Chain`
- Undo drops the start word → error: `string[]` is not a `Chain` (also red in Vitest, above)
