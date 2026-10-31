# 1.6 Game state

**Intent:** hold one game as plain data — start, target, chain and status — and move it forward one legal move at a time, so the UI (3.2) and later undo, give up and scoring (1.7, 1.8, 1.10) have a single source of truth. Plain data can be saved and restored later (4.3).
**Signature:**
- `createGame(start, target)` → `{ ok: true, game }` or `{ ok: false, reason }` where reason is `invalid-word`, `different-lengths` or `same-word`
- `applyMove(game, nextWord, dictionary)` → `{ ok: true, game }` holding the game in its new state, or `{ ok: false, reason }`: `game-over` or one of the `checkMove` reasons. The game passed in is never changed, so the caller replaces its current game with the one returned (CLAUDE.md: core logic is pure functions). Copying a chain of a few words per move costs nothing noticeable.
- `Game` is `{ start, target, chain, status }`, status `in-progress` or `won` (1.8 adds `given-up`)

## Rules protected
- The chain begins with the start word and is never empty (CLAUDE.md, Moves; 1.5 review)
- A rejected attempt is not a move: the chain is unchanged and the reason is returned (D13)
- The game is won when the chain reaches the target (CLAUDE.md, Ending)
- Start and target are the same length (CLAUDE.md, The puzzle; D4)
- Words are stored lowercase (CLAUDE.md, Moves)

## Acceptance criteria
- a new game's chain contains only the start word
- a new game is in progress
- stores the start and target in lowercase without surrounding spaces
- rejects creating a game where start and target differ in length
- rejects creating a game with a start or target that is not a word
- rejects creating a game where start and target are the same word
- applying a valid move extends the chain
- applying a move leaves the game it was given as it was
- an invalid move returns the reason from checkMove
- an invalid move leaves the chain unchanged
- the game is won when the chain reaches the target
- the game is still in progress before the target is reached
- no moves are accepted after the game is won

Backlog's "an invalid move does not count as a move" is covered by "leaves the chain unchanged": the move count is the chain length minus one, so there's no separate count to test.

## Out of scope
- Whether start and target are in the dictionary or connected: puzzle generation (2.x) picks them from the puzzle words
- Undo: 1.7. Give up and the `given-up` status: 1.8. Par and score: 1.10
- Loading the dictionary: 1.11 (it's passed in to `applyMove`, not stored in the game)
