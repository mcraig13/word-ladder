# 1.4 plan

## Approach
Normalise the given word (returning nothing if it isn't valid), then take the dictionary's words of the same length (already alphabetical and normalised) and keep those `areWordsOneLetterApart` accepts. Reusing both earlier functions means no new letter-comparison logic.

## Files
- `src/core/getWordsOneLetterAway.ts` — new
- `tests/core/getWordsOneLetterAway.test.ts` — new
- `sdlc/1.4-get-words-one-letter-away/` — these records

## Tests
| Test | Dictionary | Expected for `cold` | Rule |
|---|---|---|---|
| returns every dictionary word one letter away | cold, bold, cola, cord, warm | bold, cola, cord | All valid moves are found |
| does not include the word itself | bold, cold | bold | A move has to change something |
| does not include a word with two letters changed | cold, card, cord | cord | Exactly one letter per move *(added in review)* |
| does not include a word that changes one letter but moves the others | cold, load, cord | cord | Letters stay in the same position *(added in review)* |
| only returns words that are in the dictionary | cold, cord | cord | Only accepted words count |
| ignores words that are a letter longer or shorter | cold, colds, old | none | No adding or removing letters |
| returns nothing for a word with no words one letter away | cold, warm | none | A dead end is reported as a dead end |
| returns words in alphabetical order whatever order they were listed in | cord, cold, cola, bold | bold, cola, cord | Same date, same puzzle |
| ignores the case of the word it is given | cold, cord; looked up as `COLD` | cord | Comparisons ignore case |
| ignores spaces around the word it is given | cold, cord, colds; looked up as `cold ` | cord | Input is normalised; no adding letters *(added in review)* |
| returns nothing when given something that is not a word | cold, cord; looked up as `co1d` | none | Only a–z words *(added in review)* |

Two tests (itself; longer or shorter) are already guaranteed by `areWordsOneLetterApart`. Kept to guard against a later optimisation that bypasses it.

## Self-review
- Break: return every word of the same length → all 7 tests red
- Break: reverse the result → both order-sensitive tests red
- Break: compare case-sensitively → the case test red
- After review: the reviewer's two breaks that left everything green (accept two changed letters; ignore position) now each turn a new test red
- After review: the original, un-normalised code fails both new input tests (`cold ` gave `colds`; `co1d` gave `cold, cord`)
