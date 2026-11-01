# 3.2 Enter a move

**Intent:** let the player play today's puzzle: type a word, press Enter or Play, and see it added to the chain, or see why it was rejected and try again. The game moves into React state here, so the chain and move count update as the player plays.
**Signature:**
- `cleanUpTypedWord(typedWord: string): string` in `src/ui/`: the typed word without invisible characters (Unicode format characters, such as zero-width spaces), so they can't make a word the wrong length (1.5 review 6, carried forward).
- `App({ gameDataResult, today, launchDate })`: unchanged props. Adds a "Next word" input, a Play button, "Moves N" beside par, and a status region under the input for the reason a word was rejected. The input starts as a copy of the last word in the chain, since the next move changes only one letter of it (D36). Plain semantic HTML: 3.6a and 3.6b lay tiles and keys over this same input.

## Rules protected
- Each move changes exactly one letter, and every word must be an accepted word, not just a puzzle word (CLAUDE.md Moves; D8)
- A word already in the chain is rejected (D13)
- A rejected attempt is not a move: the player sees the reason and tries again (D13)
- Comparisons are case-insensitive (CLAUDE.md Moves)
- Word length comes from the puzzle, not a hard-coded 4 (D4)
- No moves after the game is won (1.6)
- The input starts as a copy of the last word in the chain; a rejected word stays there to edit (D36)

## Acceptance criteria
- `cleanUpTypedWord`: removes a zero-width space inside a word · removes a byte order mark before a word · removes a soft hyphen inside a word
- `App`, valid moves: shows the move count as 0 before any move · adds a valid word to the chain · counts a valid word as a move · adds each valid word after the one before · plays a word typed in capitals as lowercase · plays a word with a zero-width space in it · plays the word when the player clicks Play · starts the input holding the start word · shows the new word in the input after a valid move · clears the reason for a rejected word after a valid move
- `App`, rejected words: explains that the word must have as many letters as the start word · explains that only one letter can change · explains that a word isn't in the word list, even if it's a puzzle word · explains that a word is already in the chain · explains that only letters can be used, so a dotted capital I is rejected · explains that the game is over once the target is reached · doesn't change the chain or move count for a rejected word · keeps a rejected word in the input to edit · ignores an empty submission
- `App`, screen readers: has a status region on the page before any word is rejected · announces the reason for a rejected word in the status region

## What I'm least sure of
- **Adding `@testing-library/user-event`** (dev only, same project as React Testing Library). Tests type and press Enter the way a player does, so a form that only reacts to clicks, or doesn't submit on Enter, fails. `fireEvent` would avoid the dependency but skips the keyboard. Remove it if you'd rather keep dependencies to the minimum.
- **A dotted capital `İ` is rejected as "letters only", not turned into `i`.** This follows `normaliseWord`'s rule that input is never silently changed into another word (1.1). A Turkish keyboard in caps lock would hit it; if friends report it, mapping `İ` → `i` is one line.
- **An empty submission is ignored, with no message.** The input is only empty if the player clears it with a hardware keyboard; a message such as "Type a word." would work as well.
- **The messages' wording**: "Use a 4-letter word.", "Change exactly one letter.", "colt isn't in the word list.", "cold is already in your chain.", "Use letters only.", "The game is over."
- **The search runs once.** `useState(() => findGameForDate(…))` follows the carried-forward note, but no test can see it: it changes speed, not what the player sees. The reviewer can check it by reading.

## Out of scope
- Undo (3.3), give up (3.4), the win screen and score (3.5): after a win the input stays and says the game is over until 3.5
- Tiles, colours, layout, and clearing the reason once a letter changes (3.6a); the on-screen keyboard, `inputmode="none"` and the tile flip (3.6b) (D36)
- Keeping the chain across reloads (3.9)
