# 1.7 undoLastMove

**Intent:** take back the last word played, at no cost, so a player who wanders down a dead end can step back without starting over. Undo button (3.3) builds on it.
**Signature:** `undoLastMove(game)` → `{ ok: true, game }` holding the game without its last word, or `{ ok: false, reason }` where reason is `nothing-to-undo` (the chain is only the start word) or `game-over` (the game has ended). Like `applyMove`, the game passed in is never changed: the caller replaces its current game with the one returned.

## Rules protected
- Undo removes the last word, at no cost, and cannot go past the start word (D12)
- An undone word is no longer in the chain, so it can be played again (D12, D13)
- Undo is not available once the game has ended (backlog 1.7)
- An expected failure returns a reason rather than throwing (CLAUDE.md, Conventions)

## Acceptance criteria
- removes the last word from the chain
- can undo the first move back to the start word *(added with the tests; see plan)*
- undoing leaves the game it was given as it was
- cannot undo past the start word, with reason `nothing-to-undo`
- an undone word can be played again
- undo is not available after the game has been won, with reason `game-over`

"Removes the last word" undoes from a two-move chain and checks the whole returned game, so it would go red if undo cleared the chain back to the start, or changed start, target or status.

## Out of scope
- Undo after giving up: 1.8 adds `given-up` and should test that undo returns `game-over` for it. `game-over` is checked before `nothing-to-undo`, as in `applyMove`; that order only becomes testable in 1.8 (giving up at the start word).
- Counting undos: the score counts only the final chain (D12, 1.10)
- A hand-built game with an empty chain: restoring a saved game must check this (4.3)
