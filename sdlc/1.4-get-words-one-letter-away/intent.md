# 1.4 getWordsOneLetterAway

**Intent:** list every accepted word one move away from a given word. The solver (1.9) and hints (4.2) build on it.
**Signature:** `getWordsOneLetterAway(word, dictionary)` → alphabetical `readonly string[]`.

## Rules protected
- A move changes exactly one letter, in the same position; no adding, removing or reordering (CLAUDE.md, Moves)
- Every word in a chain must be an accepted word (CLAUDE.md, Moves)
- Comparisons ignore case, and input is normalised before use (CLAUDE.md, Moves; 1.1)
- The same date always gives the same puzzle, so results come in a stable order (D6)

## Acceptance criteria
- returns every dictionary word one letter away
- does not include the word itself
- does not include a word with two letters changed
- does not include a word that changes one letter but moves the others
- only returns words that are in the dictionary
- ignores words that are a letter longer or shorter
- returns nothing for a word with no words one letter away
- returns words in alphabetical order whatever order they were listed in
- ignores the case of the word it is given
- ignores spaces around the word it is given
- returns nothing when given something that is not a word

## Out of scope
- Whether the given word is itself in the dictionary: it isn't checked, so `colt` still gets `cold` as a move. Callers pass chain words, which `checkMove` (1.5) has already accepted.
- Repeated words in the chain: `checkMove` (1.5)
- Speed for the full 3,300-word dictionary: revisit in the solver (1.9) if needed
