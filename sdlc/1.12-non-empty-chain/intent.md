# 1.12 Non-empty chain

**Intent:** make an empty chain impossible in the types, so the compiler rules out a game with no start word and `checkMove`'s meaningless `?? ""` fallback can go. Only types change; no behaviour changes. An empty chain gives reasons that make no sense to a player (1.5 review 5, 1.6 review 6).
**Signature:**
- New type `Chain = readonly [startWord: string, ...laterWords: string[]]`: the start word, then the words played after it.
- `Game.chain` becomes `Chain` (was `readonly string[]`).
- `checkMove(chain: Chain, nextWord, dictionary)` → `CheckMoveResult`, unchanged: `{ ok: true, word }` or `{ ok: false, reason }`.
- `createGame`, `applyMove`, `undoLastMove`, `giveUp`: same results as now; the games they return carry a `Chain`.

## Rules protected
- The chain always begins with the start word (CLAUDE.md, Moves; 1.6)
- Undo cannot go past the start word (D12)
- Moves are checked from the last word in the chain (CLAUDE.md, Moves)

## Acceptance criteria
- Every existing test passes, with its values and assertions unchanged
- Type-check fails if code builds a chain without a start word (shown by breaks in self-review)
- Branch coverage is 100%

## Choices for you (beyond the backlog entry)
1. **Name and place: `Chain`, in `src/core/createGame.ts` beside `Game`.** Every chain has a start word, so "non-empty" doesn't need to be in the name; the labelled elements `startWord` and `laterWords` say it. Alternatives: `NonEmptyChain` or `WordChain`; or a new `src/core/chain.ts`. `checkMove` will import the type from `createGame.ts`. There's no cycle, because `createGame` doesn't import `checkMove`.
2. **`checkMove` takes `Chain`.** If it kept a plain array, the fallback would have to stay, which defeats the chunk.
   - The type alone doesn't remove the fallback. With `noUncheckedIndexedAccess`, both `chain[chain.length - 1]` and `chain.at(-1)` are still typed `string | undefined` (checked in a scratch prototype).
   - So the current word becomes `laterWords.at(-1) ?? startWord`, after `const [startWord, ...laterWords] = chain`. The `??` then means something to a player: before any move, the current word is the start word.
   - Existing tests already cover both sides: chains of only the start word, and "checks the move from the last word in the chain, not the start word".
3. **`undoLastMove` keeps the type by rebuilding the chain: `[startWord, ...laterWords.slice(0, -1)]`.** This compiles as a `Chain` with no cast, and gives the same result as today's `slice(0, -1)` once the `nothing-to-undo` check has passed. Rejected alternatives:
   - `as Chain`: an unsafe cast, which hides mistakes.
   - A runtime guard `isChain(words)`: adds a branch that is always true here, so it could never be covered. It belongs in 4.3 (see 6).
4. **Tests: no new tests, and only type annotations change in existing ones.**
   - Behaviour doesn't change, so the existing tests are what protects it. The new code paths are covered by: "checks the move from the last word…" and every one-word chain in `checkMove`; "removes the last word…" and "can undo the first move back to the start word" in `undoLastMove`.
   - **Tests that change:** `tests/core/checkMove.test.ts` declares 18 chains as `const chain = ["cold"]`, which TypeScript infers as `string[]`. These become `const chain: Chain = […]`, plus one import. The words, Acts and assertions don't change. Game tests already annotate `Game`, so they need no change.
   - **No compile-time test** (for example `// @ts-expect-error` on `const chain: Chain = []`). If `Chain` were widened back to `string[]`, `src/` itself would stop compiling: `startWord` would become `string | undefined`, and so would `currentWord`. A separate check would mostly test TypeScript.
   - **Type breaks:** `npm run break` runs Vitest, which doesn't type-check. Breaks of the type are therefore run by hand with `npm run lint` and recorded in `plan.md`. Behaviour breaks use `npm run break` as usual.
5. **Raise the branch threshold in `vite.config.ts` to 100 in this chunk.** *Approved.* The only uncovered branch goes, so 100 holds now, and 100 stops a new untested branch from slipping in under the 97 floor. D20 tied the raise to 4.3 only because that was the expected fix. Add a note to D20's status line ("branches raised to 100 in 1.12"), as D8's status line records its amendment, and update the comment in `vite.config.ts`. Alternative: leave 97 until 4.3.
6. **4.3 "Carried forward" becomes:** *restoring a saved game must reject a saved chain that is empty or doesn't start with the start word. `Chain` (1.12) checks only code: JSON read from storage isn't checked, so the restore code must check it at runtime, with a test (1.6 review 6, 1.12).* The threshold clause goes, because 5 already does it.

## Out of scope
- Checking a saved game loaded at runtime: 4.3
- A `getCurrentWord(chain)` helper for the UI: add it with its own tests when 3.x needs it
- Other rules the types could carry, such as "the chain ends at the target when won"
