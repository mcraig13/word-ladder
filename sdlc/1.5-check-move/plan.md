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
| ignores the case of the proposed word | cold, cord | cold | `CoRd` | ok, `cord` | Comparisons ignore case |
| reports `wrong-length` before `not-one-change` and `not-a-word` | cold | cold | `cards` | `wrong-length` | Precedence |
| reports `not-one-change` before `not-a-word` | cold | cold | `warm` | `not-one-change` | Precedence |

Every rejecting fixture contains only the reason under test where possible: `colds`, `card` and `load` are in the dictionary, so a lone dictionary check can't pass those tests. The unchanged-word test also guards precedence: `cold` is in the chain, so checking repeats first would give `repeated-word`.

## Self-review
- To do after implementation
