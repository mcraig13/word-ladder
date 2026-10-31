# 1.6 plan

## Approach
`Game` is a readonly interface in `createGame.ts`, as `Dictionary` lives in `createDictionaryFromWords.ts`. `createGame` normalises both words with `normaliseWord`, then checks length, then sameness. `applyMove` returns `game-over` unless the game is in progress, then calls `checkMove` with the whole chain and passes on its reason. On success it builds a new game with the word appended, and status `won` if that word is the target. Tests for `applyMove` write games as literals, so each test shows the exact chain and doesn't depend on `createGame`.

## Files
- `src/core/createGame.ts` — new: `Game`, `createGame`
- `src/core/applyMove.ts` — new
- `tests/core/createGame.test.ts`, `tests/core/applyMove.test.ts` — new
- `sdlc/1.6-game-state/` — these records

## Tests: createGame
| Test | Start, target | Expected | Rule |
|---|---|---|---|
| a new game's chain contains only the start word | cold, warm | chain `cold` | Chain begins with the start word |
| a new game is in progress | cold, warm | `in-progress` | Not won before a move |
| stores the start and target in lowercase without surrounding spaces | ` COLD `, `Warm` | `cold`, `warm`, chain `cold` | Words stored lowercase |
| rejects creating a game where start and target differ in length | cold, warms | `different-lengths` | Same length (D4) |
| rejects creating a game with a start that is not a word | co1d, warm | `invalid-word` | Only a–z words |
| rejects creating a game with a target that is not a word | cold, `` | `invalid-word` | Only a–z words |
| rejects creating a game where start and target are the same word | cold, COLD | `same-word` | A game needs a move |

## Tests: applyMove
Dictionary for all: cold, cord, card, ward, warm, worm. Target `warm`.

| Test | Chain (status) | Next word | Expected | Rule |
|---|---|---|---|---|
| applying a valid move extends the chain | cold | cord | chain cold, cord | A legal move is added |
| applying a move leaves the game it was given as it was | cold | cord | given game still cold | Pure function |
| an invalid move returns the reason from checkMove | cold | card | `not-one-change` | Rejected attempts give a reason (D13) |
| an invalid move checks repeats against the whole chain | cold, cord, card | cord | `repeated-word` | No repeats (D13) |
| an invalid move leaves the chain unchanged | cold, cord | word | given game still cold, cord | A rejected attempt is not a move (D13) |
| the game is won when the chain reaches the target | cold, cord, card, ward | warm | `won`, chain ends warm | Winning |
| the game is won when the target is typed in a different case | cold, cord, card, ward | WARM | `won` | Comparisons ignore case |
| the game is still in progress before the target is reached | cold | cord | `in-progress` | Not won early |
| no moves are accepted after the game is won | …, ward, warm (won) | worm | `game-over` | Game ends at the target |
| reports game-over before any other reason | …, ward, warm (won) | cards | `game-over` | Precedence |

`worm` is a legal move from `warm`, so only the game-over rule can reject it. The diff will be about 300 lines, mostly tests (as in 1.5).

## Self-review
- Break: store the start as given, not normalised → red: `stores the start and target in lowercase…`
- Break: drop the same-word check → red: `…are the same word`
- Break: drop the length check → red: `…differ in length`
- Break: only check that the start is a word → red: `…a target that is not a word`
- Break: start with an empty chain → red: `a new game's chain contains only the start word`, `stores…`
- Break: drop the game-over check → red: both `game-over` tests
- Break: pass only the current word to `checkMove` → red: `…checks repeats against the whole chain`
- Break: compare the raw input with the target → red: `…target is typed in a different case`
- Break: always set status `won` → red: `…still in progress…`
- Break: also push the move onto the given game's chain → red: `…leaves the game it was given as it was` and two others
- Break: append the word before checking and keep it on failure → red: `an invalid move leaves the chain unchanged` and six others
