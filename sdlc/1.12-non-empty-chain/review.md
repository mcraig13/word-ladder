# 1.12 review

**Reviewer:** independent agent, fresh context · **Verdict:** approve

Does what the intent says and stays in scope; every changed file is in the plan. The test diff only adds `: Chain` to 18 chains and one type import. Lint is clean, 87 tests pass, and coverage is 100% on all four measures (46/46 branches).

## Findings
1. **note** `Chain` ensures there is a first word, but not that the first word is `game.start`. Building `[target]` in `createGame` or `undoLastMove` compiles, though tests go red. The rule is protected by the tests, not the type; the intent's first "rule protected" claims more than that. — *Response:* fixed. The intent now says the type guarantees a first word and the tests guarantee it is the start word. No code change.
2. **note** An empty chain cast past the type now makes `checkMove` throw a `TypeError`, where the old fallback returned `wrong-length`. Code can only produce one through a cast or unchecked JSON. — *Response:* fixed. The 4.3 *Carried forward* line now says that without the restore check, an empty chain makes `checkMove` throw. The code is unchanged; restore (4.3) is the right place for the runtime check.
3. **nit** `undoLastMove` guards on `game.chain.length <= 1`, then splits the chain into `startWord` and `laterWords`. If the split came first and the guard read `laterWords.length === 0`, both would describe the same thing. — *Response:* fixed. The split now comes before the guard, and the guard reads `laterWords.length === 0`; behaviour is identical. The reviewer's guard break, redone on the new guard (`< 0`), → red: "cannot undo past the start word". `<= 1` → red: "can undo the first move back to the start word". Target in place of the start word → red: "removes the last word…", "can undo the first move…", "an undone word…".

## Reviewer's own break-the-code checks
Behaviour breaks (0 not applied, 0 all green):
- `checkMove` current word is the second-to-last word → red: 10 tests, including "checks the move from the last word in the chain, not the start word"
- `checkMove` uses the start word whenever one word follows it → red: 5 tests, including "rejects the start word with reason repeated-word"
- Repeat check compares only with the current word → red: "rejects a word used earlier in the chain…", and 3 more
- `undoLastMove` puts `game.target` in place of the start word → red: "removes the last word…", "can undo the first move…", "an undone word…" (compiles; finding 1)
- `undoLastMove` guard `<= 1` → `< 1` → red: "cannot undo past the start word"
- `applyMove` puts the new word before the start word → red: "applying a valid move extends the chain", and 3 more
- `createGame` starts the chain with the target → red: "a new game's chain contains only the start word", "stores the start and target in lowercase…" (compiles; finding 1)

Awkward input checked: an uppercase chain, a padded `" CARD "`, and undo leaving the original game unchanged all match the rules.
