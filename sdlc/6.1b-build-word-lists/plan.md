# 6.1b plan

## Approach
- `getLargestWordCloud`: put the words in a dictionary (`createDictionaryFromWords` dedupes and sorts). Go through them alphabetically; for each word not yet in a cloud, breadth-first search with `getWordsOneLetterAway` to collect its cloud. Keep a cloud only if it's strictly bigger than the best so far, so ties go to the first word. Return the cloud sorted.
- `getWordLists`: call `getWordsFromHunspell` for the accepted source, then the puzzle source, with the same two lists; return the first failure with its `wordList`. Keep words of `wordLength`. Accepted = largest cloud; puzzle = puzzle-source words in the accepted set, in order.
- `scripts/buildWordLists.mjs`, run with `tsx` (changed after review from `runnerImport`): import `getWordLists.ts`, read the six files with `node:fs` as UTF-8, call with `wordLength: 4`, then write or print and exit 1. Style as `break.mjs`.
- Session B times `findShortestPath` on the built list from a scratch script (worst case: an unreachable target) and records it under Self-check.

## Files
- `scripts/words/getLargestWordCloud.ts`, `scripts/words/getWordLists.ts` — new, pure (D21 lint applies)
- `scripts/buildWordLists.mjs` — new entry script
- `package.json`, `package-lock.json` — `build:words` script; `tsx` dev dependency (after review)
- `data/words/exclude.txt`, `blocklist.txt` — new, header comment only; `accepted.txt`, `puzzle.txt` — built; `.gitkeep` removed
- `tests/scripts/words/getLargestWordCloud.test.ts`, `getWordLists.test.ts`, `getWordLists.scowl.test.ts` — new
- `CLAUDE.md` Commands — add `npm run build:words`; `backlog.md` — status line on merge

## Tests
| Test | Rule |
|---|---|
| keeps the largest cloud and drops the smaller ones | largest cloud (D8) |
| keeps words that are joined only through a chain of moves | a cloud is connected by moves, not direct neighbours (D8) |
| chooses the cloud with the alphabetically first word when two clouds are the same size | same inputs, same output |
| gives the same cloud, in alphabetical order, whatever order the words come in | same inputs, same output |
| counts a word given twice once when comparing cloud sizes | cloud size counts words |
| has no cloud when there are no words | edge case |
| counts Cold and cold as one word when comparing cloud sizes | mixed case (added at review) |
| leaves out entries that aren't words | edge case (added at review) |
| accepted words are the largest 4-letter Word Cloud of the size-70 list | backlog; D8, D17 |
| builds the lists for the word length asked for | D4 |
| removes an excluded word before finding the cloud, so words joined only through it drop out | D17 cleaning |
| removes a blocked word before finding the cloud, so words joined only through it drop out | D17 cleaning |
| puzzle words are size-60 words that are also accepted words | backlog; D17 |
| leaves out a size-60 word that is in the size-70 list but outside its largest cloud | every puzzle solvable (D8) |
| keeps size-60 words that only size-70 words join together | puzzle words aren't limited to the size-60 cloud (D17) |
| reports the size-70 list, file and line when its dictionary can't be read | failure names its list (carried forward) |
| reports the size-60 list, file and line when its dictionary can't be read | failure names its list |
| reports the size-70 list first when both dictionaries can't be read | failure order (added at review) |
| builds the same accepted words as the committed accepted.txt | same output files; no hand edits |
| builds the same puzzle words as the committed puzzle.txt | same output files; no hand edits |
| makes cold, warm and high puzzle words, high being joined only through size-70 words | D17 evidence |
| makes every puzzle word an accepted word, so every puzzle is inside the cloud | backlog connectivity |
| connects every accepted word to every other, so every puzzle is solvable | backlog connectivity, real data (added after review) |
| does not accept evil, exam or hymn, which are outside the cloud at any size | D17 evidence |
| finds a 4-move shortest path from cold to warm over the committed accepted words | CLAUDE.md example; par 6 (D27) |

## Self-check
- Files: match the list above; `backlog.md` status waits for the merge. Built: 3,318 accepted, 2,622 puzzle words (D17 measured 3,308 and 2,614 before 6.1a's cleaning). `findShortestPath` on the built list: cold → warm about 100 ms, an unreachable target (whole cloud searched) about 220 ms on a PC.
- Lint, tests and coverage: pass, 209 tests after review (205 before), 100% coverage; the build takes about 1 s and prints `data/words/exclude.txt:4 invalid-word`, exit 1, for a bad exclusion line.
- Diff against intent: as intended; the two functions stay pure and the `.mjs` entry only reads, calls and writes.
