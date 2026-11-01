# 3.2 plan

## Approach
Rules stay in `applyMove` and `checkMove`; the UI only cleans up what was typed, calls them, and shows the result.

- `cleanUpTypedWord(typedWord)` removes every Unicode format character (`/\p{Cf}/gu`: zero-width spaces and joiners, byte order marks, soft hyphens) and changes nothing else. A dotted `İ` isn't a format character, so it reaches `normaliseWord` and is rejected as `not-letters`.
- `App` keeps its props. It works out today's game once, with `useState(() => …)` (carried forward from 3.1), and renders `TodaysGame` with the first game and the accepted words. `TodaysGame` holds the game, the typed word (starting as the start word) and the rejection message in `useState`.
- On submit (`<form>`, so Enter and Play both submit; `preventDefault` stops the page reloading): `cleanUpTypedWord`, then `normaliseWord`. An empty word is ignored. Non-letters get their message. Otherwise `applyMove(game, word, acceptedWords)`: accepted words, never puzzle words (D8). On success the game is replaced, the input shows the word played and the message clears. On failure the message shows and the input keeps what was typed.
- Messages are worked out by one `switch` over the reason, typed so a new reason fails the type-check. Word length comes from `game.start.length` (D4).
- The `role="status"` paragraph sits under the input row (D36) and is always on the page, empty until a word is rejected, so screen readers announce text added to it.
- Beside par, `<p>Moves {chain.length - 1}</p>` (D36's header holds both).

## Files
- `src/ui/cleanUpTypedWord.ts` — new
- `src/ui/App.tsx` — `TodaysGame`, the form, moves and status region
- `tests/ui/cleanUpTypedWord.test.ts` — new
- `tests/ui/App.test.tsx` — new tests; the fixture's puzzle words gain `colt`, which isn't an accepted word
- `package.json`, `package-lock.json` — `@testing-library/user-event` (dev)
- `sdlc/3.2-enter-a-move/` — these records

## Tests
| Test | Rule |
|---|---|
| **cleanUpTypedWord** | |
| removes a zero-width space inside a word | Carried forward from 1.5: invisible characters aren't letters |
| removes a byte order mark before a word | Same; catches removing only zero-width spaces |
| removes a soft hyphen inside a word | Same; a format character outside the zero-width block |
| **App: valid moves** | |
| shows the move count as 0 before any move | Moves count from the start word (1.12) |
| adds a valid word to the chain | One-letter change to an accepted word is a move |
| counts a valid word as a move | Moves are the words after the start |
| adds each valid word after the one before | Catches checking against the first game instead of the current one |
| plays a word typed in capitals as lowercase | Comparisons are case-insensitive |
| plays a word with a zero-width space in it | Carried forward from 1.5, through the page |
| plays the word when the player clicks Play | Both ways of submitting work |
| starts the input holding the start word | The input starts as a copy of the last word (D36) |
| shows the new word in the input after a valid move | Same, after a move; catches showing the stale word (D36) |
| clears the reason for a rejected word after a valid move | Catches a stale message |
| **App: rejected words** | |
| explains that the word must have as many letters as the start word | `wrong-length`; length from the puzzle (D4) |
| explains that only one letter can change | `not-one-change` |
| explains that a word isn't in the word list, even if it's a puzzle word | `not-a-word`; moves use accepted words (D8) |
| explains that a word is already in the chain | `repeated-word` (D13) |
| explains that only letters can be used, so a dotted capital I is rejected | Carried forward from 1.5: `İ` gets a true reason, not `wrong-length` |
| explains that the game is over once the target is reached | No moves after a win (1.6) |
| doesn't change the chain or move count for a rejected word | A rejected attempt isn't a move (D13) |
| keeps a rejected word in the input to edit | The player tries again from what they typed (D13, D36) |
| ignores an empty submission | Not a move, and nothing to explain |
| **App: screen readers** | |
| has a status region on the page before any word is rejected | A live region added with its text may not be announced |
| announces the reason for a rejected word in the status region | backlog 3.2 |

The 3.1 App tests are unchanged.

## Self-check
- Files (`git diff --name-only origin/main...HEAD`): `package-lock.json`, `package.json`, `sdlc/3.2-enter-a-move/intent.md`, `plan.md`, `src/ui/App.tsx`, `src/ui/cleanUpTypedWord.ts`, `tests/ui/App.test.tsx`, `tests/ui/cleanUpTypedWord.test.ts` — match the plan (local `main` was behind `origin/main`, which added D36)
- Lint, tests and coverage: `All matched files use Prettier code style!` (tsc and ESLint silent) · `Tests 379 passed (379)` · `Statements 100% (449/449) Branches 100% (259/259) Functions 100% (75/75) Lines 100% (435/435)`
- Diff against intent: `App` finds the game once and `TodaysGame` plays typed words through `cleanUpTypedWord`, `normaliseWord` and `applyMove` over the accepted words, with Moves, the prefilled input and the status region; nothing from 3.3–3.6b
