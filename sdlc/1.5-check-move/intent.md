# 1.5 checkMove

**Intent:** decide whether a proposed next word is a legal move from the current chain and, if not, say exactly why, so the player sees the reason and tries again. Game state (1.6) builds on it.
**Signature:** `checkMove(chain, nextWord, dictionary)` → `{ ok: true, word }` with the word in stored (normalised) form, or `{ ok: false, reason }` where reason is `wrong-length`, `not-one-change`, `not-a-word` or `repeated-word`.

## Rules protected
- A move changes exactly one letter, in the same position; no adding, removing or reordering (CLAUDE.md, Moves)
- Every word in the chain must be an accepted word (CLAUDE.md, Moves)
- A word already in the current chain is rejected (D13)
- A rejected attempt returns a reason rather than throwing (CLAUDE.md, Conventions; D13)
- Comparisons ignore case; surrounding spaces are ignored (CLAUDE.md, Moves; 1.1)

## Acceptance criteria
- accepts a valid one-letter change to an accepted word
- returns the accepted word in lowercase without surrounding spaces
- rejects a word of a different length with reason `wrong-length`
- rejects an empty word with reason `wrong-length`
- rejects a change of more than one letter with reason `not-one-change`
- rejects an unchanged word with reason `not-one-change`
- rejects a word that moves letters around with reason `not-one-change`
- rejects a word not in the dictionary with reason `not-a-word`
- rejects a word containing non-letters with reason `not-a-word`
- rejects a word used earlier in the chain with reason `repeated-word`
- rejects the start word with reason `repeated-word`
- ignores the case of the proposed word
- reports `wrong-length` before `not-one-change` and `not-a-word`
- reports `not-one-change` before `not-a-word`

Precedence is length → change → word → repeat (backlog 1.5). `not-a-word` before `repeated-word` can't be tested meaningfully: every chain word was accepted, so a repeated word is always in the dictionary.

## Out of scope
- Applying the move, the move count, and winning on reaching the target: game state (1.6)
- Undo, and replaying an undone word: 1.7 (it works here because an undone word is no longer in the chain passed in)
- An empty chain: callers always pass a chain starting with the start word (1.6 guarantees it). Not checked here.
- Whether the chain itself is valid: its words were accepted by earlier calls
