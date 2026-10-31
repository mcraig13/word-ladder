# 1.5 plan

## Approach
Trim and lowercase the proposed word, then run the checks in precedence order, returning the first failure: length against the current (last) chain word; `areWordsOneLetterApart`; `dictionary.containsWord`; then whether the chain already includes it. Non-letters need no special case: `containsWord` rejects them, which gives `not-a-word`. Exports a `CheckMoveResult` type alongside the function, like `NormaliseResult`.

## Files
- `src/core/checkMove.ts` — new
- `tests/core/checkMove.test.ts` — new
- `sdlc/1.5-check-move/` — these records

## Tests
| Test | Dictionary | Chain | Next word | Expected | Rule |
|---|---|---|---|---|---|
| accepts a valid one-letter change to an accepted word | cold, cord | cold | `cord` | ok, `cord` | A legal move is accepted |
| checks the move from the last word in the chain, not the start word | cold, cord, card | cold, cord | `card` | ok, `card` | Moves are from the current word *(added in self-review)* |
| rejects a word one letter from an earlier word but not the last one with reason `not-one-change` | cold, cord, colt | cold, cord | `colt` | `not-one-change` | Moves are from the current word *(added in review)* |
| accepts a move between words of another length | cat, cot | cat | `cot` | ok, `cot` | Length is a parameter (D4) *(added in review)* |
| returns the accepted word in lowercase without surrounding spaces | cold, cord | cold | ` CORD ` | ok, `cord` | Words are stored lowercase |
| rejects a word of a different length with reason `wrong-length` | cold, colds | cold | `colds` | `wrong-length` | No adding letters |
| rejects an empty word with reason `wrong-length` | cold | cold | `` | `wrong-length` | No removing letters |
| rejects a change of more than one letter with reason `not-one-change` | cold, card | cold | `card` | `not-one-change` | Exactly one letter per move |
| rejects an unchanged word with reason `not-one-change` | cold | cold | `cold` | `not-one-change` | A move has to change something |
| rejects a word that moves letters around with reason `not-one-change` | cold, load | cold | `load` | `not-one-change` | Letters stay in the same position |
| rejects a word not in the dictionary with reason `not-a-word` | cold | cold | `colt` | `not-a-word` | Only accepted words |
| rejects a word containing non-letters with reason `not-a-word` | cold | cold | `co1d` | `not-a-word` | Only accepted words |
| rejects a word used earlier in the chain with reason `repeated-word` | cold, cord, card | cold, cord, card | `cord` | `repeated-word` | No repeats (D13) |
| rejects the start word with reason `repeated-word` | cold, cord | cold, cord | `cold` | `repeated-word` | No repeats (D13) |
| rejects a repeated word typed in a different case with reason `repeated-word` | cold, cord, card | cold, cord, card | `CORD` | `repeated-word` | Comparisons ignore case *(added in review)* |
| ignores the case of the proposed word | cold, cord | cold | `CoRd` | ok, `cord` | Comparisons ignore case |
| reports `wrong-length` before `not-one-change` and `not-a-word` | cold | cold | `cards` | `wrong-length` | Precedence |
| reports `not-one-change` before `not-a-word` | cold | cold | `warm` | `not-one-change` | Precedence |

Every rejecting fixture contains only the reason under test where possible: `colds`, `card` and `load` are in the dictionary, so a lone dictionary check can't pass those tests. The unchanged-word test also guards precedence: `cold` is in the chain, so checking repeats first would give `repeated-word`.

## Self-review
- Break: check repeats before the one-letter change → red: `rejects an unchanged word…`
- Break: skip the dictionary check → red: both `not-a-word` tests
- Break: check the move from the start word, not the last word → only `rejects the start word…` went red, and only by accident. Added `checks the move from the last word in the chain…`, which goes red on this break.
- Break: don't trim → red: `returns the accepted word in lowercase…`
- Break: don't lowercase → red: that test and `ignores the case…`
- Break: check repeats against the last word only → red: both `repeated-word` tests
- Break: skip the length check → red: all three `wrong-length` tests (they fall through to `not-one-change`)
- After review: the reviewer's three breaks that left everything green (repeat check ignores case; accept a change from the start word; length hard-coded to 4) now each turn a new test red
