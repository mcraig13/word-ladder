# 6.1b Build the word list files

**Intent:** build `data/words/accepted.txt` and `puzzle.txt` from the two SCOWL dictionaries with one command, so 1.11 can load them and 2.2 can pick puzzles that are always solvable. The committed lists are checked against a fresh build in the tests, so they can't drift from their sources.
**Signature:**
- `getLargestWordCloud(words)` → the words of the largest Word Cloud, in alphabetical order; `[]` for no words.
- `getWordLists({ acceptedWordsSource, puzzleWordsSource, exclusionListText, blocklistText, wordLength })`, each source `{ affixText, dictionaryText }` → `{ ok: true, acceptedWords, puzzleWords }`, or `getWordsFromHunspell`'s failure plus `wordList: "accepted" | "puzzle"`.
- `npm run build:words` reads the files, prints `<file>:<line> <reason>` and exits 1 on failure, otherwise writes the two lists.

## Rules protected
- Accepted words are the largest cloud of the cleaned size-70 list; puzzle words are size-60 words in it (D8, D17)
- Exclusion list and blocklist apply before the cloud is found (D17, cleaning)
- Word length is a parameter (D4)
- The same inputs always give the same files (backlog 6.1b; daily puzzle order, 1.2)
- Built lists are never edited by hand (CLAUDE.md, Don'ts)

## Acceptance criteria
- Backlog: `accepted words are the largest 4-letter Word Cloud of the size-70 list`; `puzzle words are size-60 words that are also accepted words`; connectivity: `leaves out a size-60 word … outside its largest cloud`, `keeps size-60 words that only size-70 words join together`; sameness: `gives the same cloud … whatever order`, `builds the same accepted/puzzle words as the committed …txt`
- Also: ties, repeats, no words, word length 3, exclusion and blocklist before the cloud, failures naming each list, D17's sample words, and cold → warm in 4 moves on the real list

## Choices (beyond the backlog entry)
1. **Running the `.ts` code: `npm run build:words` runs `scripts/buildWordLists.mjs` with `tsx`.** Changed after review, by the human reviewer, from Vite's `runnerImport`, which is marked experimental in Vite 8. `tsx` is a new dev dependency (it uses esbuild, which Vite already installs) but stable, and needs no change to imports. Node's own type stripping would need `.ts` on every import along the way.
2. **The entry script is `.mjs`, has no logic and no tests.** Coverage counts only `.ts`, so it stays out without a config change. Everything testable is in the two pure functions in `scripts/words/`.
3. **The committed lists are tested against a fresh build** (`getWordLists.scowl.test.ts`), so CI fails if they're stale or edited by hand. Cost: about a second or two of test time.
4. **Ties between clouds of equal size** go to the one with the alphabetically first word. They can't happen with the real lists (the largest is 96%), but the result must not depend on input order.
5. **New files `data/words/exclude.txt` and `blocklist.txt`**, holding only a header comment, for 6.2 and 6.3 to fill. Output format: one word per line, LF, a newline at the end, no comments.

## What I'm least sure of
- **Size:** about 120 lines of code but about 380 of tests, so over the ~200 limit. I'd keep it as one chunk (the tests are fixtures and most of it); splitting off `getLargestWordCloud` is the alternative.
- **Choice 1:** `tsx` adds a dev dependency, and the build and the tests now run the code through different transformers (esbuild and Vite). The committed-list tests would catch a difference. CI doesn't run `build:words`, so a broken build shows only when someone rebuilds.
- **Real-data connectivity** (updated after review): one breadth-first search from cold over the committed list, using the core move rule, checks it in about 0.2 s; checking every pair, as first planned, isn't needed.

## Out of scope
- Loading the lists in the app (1.11); filling the exclusion list (6.2) and blocklist (6.3)
- Speeding up `getWordsOneLetterAway`: only timed here, per the carried-forward note
