# 1.7 plan

## Approach
`undoLastMove` returns `game-over` unless the game is in progress, then `nothing-to-undo` if the chain is only the start word. Otherwise it returns a new game with the chain minus its last word; start, target and status are copied across (status is always `in-progress` here, since only an in-progress game can be undone). Tests write games as literals, as in `applyMove`.

## Files
- `src/core/undoLastMove.ts` — new
- `tests/core/undoLastMove.test.ts` — new
- `sdlc/1.7-undo-last-move/` — these records

## Tests
Dictionary (only the replay test uses it): cold, cord, card, ward, warm. Target `warm`.

| Test | Chain (status) | Expected | Rule |
|---|---|---|---|
| removes the last word from the chain | cold, cord, card | whole game: chain cold, cord; start, target, status kept | Undo removes the last word (D12) |
| can undo the first move back to the start word | cold, cord | chain cold | Undo reaches, but doesn't pass, the start word (D12) |
| undoing leaves the game it was given as it was | cold, cord | given game still cold, cord | Pure function |
| cannot undo past the start word | cold | `nothing-to-undo` | Cannot go past the start word (D12) |
| an undone word can be played again | cold, cord, card → undo, then play card | chain cold, cord, card | Undone word is no longer used (D12, D13) |
| undo is not available after the game has been won | …, ward, warm (won) | `game-over` | No undo once the game has ended (backlog 1.7) |

"Can undo the first move" was added while writing tests: with only a three-word chain, a check of `chain.length <= 2` instead of `<= 1` would leave every test green. The replay test calls `undoLastMove` in Arrange so the Act is the replay itself.

## Self-review
(after implementation)
