# 6.1b review

Two reviewers in parallel (M chunk, D29) on `f9a5d58..453a6a7`. Fixes are in d1fb0ae.

**Tests changed after human review:** `builds the lists for the word length asked for` (bigger 4-letter cloud in the fixture, same expected result), `gives the same cloud … whatever order` (new input and expected value), and the two committed-list tests (compare whole file text, not words). Added: `counts Cold and cold as one word when comparing cloud sizes`, `leaves out entries that aren't words`, `reports the size-70 list first when both dictionaries can't be read`.

**Changed after review, by the human reviewer:** `build:words` runs the entry script with `tsx` instead of Vite's experimental `runnerImport` (intent, choice 1). New dev dependency; the rebuilt lists are byte for byte the same, and the failure output is unchanged.

## Reviewer A: breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** The word-length rule (D4) is guarded only by the slow real-data run. Removing the length filter in `getWordLists.ts`, or changing it to `>=`, leaves every fixture test green, because the fixture's 3-letter cloud (4 words) is already bigger than its 4-letter cloud (3 words). Those breaks go red only as a 120 s timeout of the real-data test. Fix: make the other-length cloud bigger. — *Response:* fixed in d1fb0ae. The 4-letter cloud in the fixture is now card-cold-cord-ward-warm (5), bigger than cat-cot-cog-dog (4), so a missing or loosened filter returns the wrong cloud.
2. **nit** No test says which list's failure is reported when both fail; swapping the two checks stays green. — *Response:* fixed in d1fb0ae: `reports the size-70 list first when both dictionaries can't be read` (the two failures are on different lines, so the line number tells them apart too).
3. **nit** `getLargestWordCloud(["Cold", "cord", "cold"])` returns `["Cold", "cold", "cord"]`: the loop uses the raw input while neighbours come from the normalised dictionary. — *Response:* fixed in d1fb0ae, with reviewer B's finding 1.

**Notes:** build is byte-identical to the committed files; a bad exclusion line prints `data/words/exclude.txt:4 invalid-word`, exit 1; mixed-case CRLF exclusion lines apply; `.gitattributes` keeps LF on Windows; empty input, length 0 and invalid entries don't crash; type-check, ESLint, Prettier and coverage pass. Four all-green breaks are equivalent mutants: no input dedupe (C4), no skip of words already in a cloud (C5, performance only), lists not passed to the size-60 read (L6, L7, puzzle words are intersected with cleaned accepted words).

### Reviewer's own break-the-code checks
- Largest cloud: `>` → `>=`, input order instead of sorted, early return for short lists → red: the tie test. Keep the smallest cloud, first word not marked seen, direct neighbours only, neighbours of `firstWord` → red: cloud tests, getWordLists fixtures, committed-list tests. Return unsorted → red: 3 cloud tests, accepted-words and word-length tests, committed accepted.txt.
- No input dedupe, skip-seen guard deleted → all green, equivalent.
- Word length: hard-coded `4` → red: word-length test. Filter removed or `>=` → red only by timeout → finding 1.
- Exclusion list / blocklist not passed to the size-70 read, separately and together → red: the matching `removes an excluded/blocked word` tests. Not passed to the size-60 read → all green, equivalent.
- Puzzle words: not filtered by accepted words → red: 3 puzzle tests and committed puzzle.txt. Puzzle = accepted, puzzle = size-60's own cloud, accepted built from size 60 → red: `keeps size-60 words that only size-70 words join together` and others.
- Failures: labels swapped, size-60 guard replaced by success, size-70 guard deleted, wrong line → red: the matching failure test. Size-60 checked first → all green → finding 2.

## Reviewer B: everything except breaks

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes

### Findings
1. **should fix** `getLargestWordCloud` gives wrong results for input that isn't lowercase a–z: `["Cold", "cord"]` returns `["Cold", "cold", "cord"]` (one word counted twice), `["co-op", "cold", ""]` returns `[""]`. The function is exported, so CLAUDE.md's mixed-case edge cases apply. — *Response:* fixed in d1fb0ae. Input is normalised with `normaliseWord` before the search, as the dictionary does. Tests: `counts Cold and cold as one word when comparing cloud sizes` (fails before the fix: cold-cord becomes a cloud of 3 and beats able-axle), `leaves out entries that aren't words`.
2. **nit** An exclusion-list or blocklist failure says `wordList: "accepted"`, though those files are shared. — *Response:* documented in d1fb0ae: the `WordList` comment says it names the list being built, and a shared-list failure names accepted, read first. The build already prints the right file.
3. **nit** The committed-list tests compare words, so a blank line or missing final newline added by hand still passes. — *Response:* fixed in d1fb0ae: both tests compare the whole file text with the build's format.
4. **nit** `gives the same cloud … whatever order the words come in` uses one ordering that mostly repeats another test. — *Response:* fixed in d1fb0ae: the input is now a tie in reverse alphabetical order (cord-cold, axle-able), so a search in input order picks the wrong cloud, and the expected words come out sorted.
5. **nit** The real-data file rebuilds the lists in five tests (about 2 s); one shared build would cut it to 0.4 s. — *Response:* not changed. Each test keeps its one Act (CLAUDE.md, AAA); the cost was accepted in intent choice 3.
6. **note** A real-data connectivity check doesn't take minutes: one breadth-first search covers the cloud (about 235 ms). — *Response:* not changed. Reusing `getLargestWordCloud` is the weak check the reviewer describes, and a second search in the test would copy the logic under test. Least-sure point corrected in the PR description; the fixture tests and `makes every puzzle word an accepted word` carry the rule.

**Notes:** type-check, ESLint, Prettier, 205 tests and coverage pass; the build takes about 1 s and rebuilds both lists byte for byte; a bad `.dic` line prints its file and line, exit 1; a missing source file gives a Node stack trace, acceptable through `npm run`; `runnerImport` works with Vite 8.3.5 (since replaced by `tsx`, see below); word length 0 gives two empty lists; tests, fixtures and names meet CLAUDE.md; the SCOWL licence is untouched.
