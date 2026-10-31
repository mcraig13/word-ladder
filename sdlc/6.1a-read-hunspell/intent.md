# 6.1a Read Hunspell dictionaries

**Intent:** turn one SCOWL Hunspell `.aff`/`.dic` pair into a clean list of lowercase words, applying D17's cleaning steps, so 6.1b can build the accepted and puzzle lists from `en_GB-large` and `en_GB-ise`. A rule or entry the code doesn't understand is reported, never skipped, so a new SCOWL release can't drop words quietly.
**Signature:** `getWordsFromHunspell({ affixText, dictionaryText, exclusionListText, blocklistText })` → `GetWordsFromHunspellResult`:
- `{ ok: true, words }`: every word, of every length, lowercase a–z, each once, in character-code order (as `createDictionaryFromWords` sorts).
- `{ ok: false, reason, file, lineNumber }`, where `file` is `affix`, `dictionary`, `exclusion` or `blocklist`, `lineNumber` counts from 1, and reason is:
  - `unsupported-line`: an `.aff` or `.dic` line in a form the code doesn't support (list below)
  - `unknown-flag`: a dictionary word uses a flag that no affix rule or `NOSUGGEST` defines
  - `invalid-word`: an exclusion-list or blocklist line that isn't a word

The affix file is checked first, then the two lists, then the dictionary; the first problem found is returned.

**What 6.1b calls:** it reads the four files as UTF-8 text and calls this once per dictionary (`en_GB-large`, then `en_GB-ise`), with the same exclusion list and blocklist. Then it keeps the 4-letter words and builds the cloud.

## Rules protected
- Expand Hunspell endings; keep only lowercase words; drop Roman numerals; drop the exclusion list; drop SCOWL's taboo-flagged words and the blocklist (D17, cleaning)
- Accepted words have no proper nouns, abbreviations, Roman numerals or apostrophes (D8)
- A word contains only the letters a–z, stored lowercase (CLAUDE.md, Moves; `normaliseWord`)
- The same inputs always give the same list (D6, via 6.1b: "the same inputs always produce the same output files")
- An expected failure returns a reason rather than throwing (CLAUDE.md, Conventions)

## Acceptance criteria
Backlog criteria first, then the ones the choices below add. The full list, with fixtures, is in `plan.md`.
- expands words with their Hunspell endings (`cold/S` gives `colds`)
- does not add possessive forms (`cold's`)
- drops words that only appear capitalised (`Bach`, `Avon`)
- keeps a word that has both a capitalised and a lowercase entry (`polish`)
- drops entries containing non-letters
- drops Roman numerals (`xiii`, `clix`) but keeps real words made of the same letters (`mild`, `mill`, `dill`, `lid`, `dim`, `civil`, `vim`)
- keeps `mix`, a real word that is also a Roman numeral
- drops words on the exclusion list
- drops words SCOWL flags as taboo and words on the blocklist
- plus: prefixes, conditions, cross-product, the strip rules, one test for each `unsupported-line` case, `unknown-flag`, `invalid-word`, list format, Windows line endings, and a smoke check on the real files

## Choices for you (beyond the backlog entry)

1. **Where the code lives: `scripts/words/getWordsFromHunspell.ts`, checked like `src/`.** Recommended.
   - `scripts/` is where the backlog and CLAUDE.md put build-time code, and `vite.config.ts` already counts `scripts/**/*.ts` in coverage (D20). What's missing is the type-check: `tsconfig.json` includes only `src`, `tests` and `vite.config.ts`, so ESLint's type-aware rules would also fail on a `.ts` file in `scripts/`. I add `"scripts"` to `include`. `break.mjs` is JavaScript and isn't affected.
   - **D21 purity rules** apply to `scripts/words/` too: I add that folder to the `src/core/**` block in `eslint.config.js` (no DOM, storage, `fetch`, timers, `Date`, `performance`, `crypto`, `Math.random`, Node modules). The messages say "src/core"; I reword them to "pure code" so they read right in both places. The yes/no naming rule (`is`, `has`…) is extended from `src/**` to `scripts/**`.
   - **I/O:** nothing in this chunk reads a file at run time. The function takes text and returns words. 6.1b's entry script (`scripts/build-words.ts`, outside `scripts/words/`) does the reading and writing, so it isn't under the purity rules. The smoke test loads the real files with Vite's `?raw` import, which `vite/client`'s types already declare, so no Node types or `node:fs` are needed.
   - Tests go in `tests/scripts/words/`, mirroring the source.
   - Alternative: put the pure parser in `src/words/`. That needs no config change, but it puts build-time code beside the app's code, and `scripts/` would then hold only 6.1b's file-reading wrapper.

2. **Inputs are text, for all four files; output is a sorted, deduplicated, lowercase list of every length.**
   - Text in, rather than word arrays for the lists, so the list format is defined and tested in one place, and 6.1b only reads files.
   - **Length filter in 6.1b, not here.** D4 makes length a parameter, and 6.1b needs it anyway for the cloud. A reader that returns all lengths is simpler and is the honest picture of the dictionary.
   - Named per CLAUDE.md: `get…` works out a value. Not `create…`, because it isn't a new `Dictionary`; 6.1b and 1.11 do that.

3. **Which Hunspell features: exactly what these two `.aff` files use.** I read both: they're identical apart from the title comment.
   - **Flags:** no `FLAG` line, so each flag is one character. The files use `A–Z`, `!` and, on number entries only, `c m n p t 1`.
   - **Prefixes and suffixes:** both are needed. 7 `PFX` groups (`re`, `in`, `un`, `de`, `dis`, `con`, `pro`), all with strip `0` and condition `.`. 22 `SFX` groups, with strip `0`, `e` or `y`.
   - **Conditions:** `.`, a letter, `[...]` and `[^...]`, in sequences of up to two (`[^aeiou]y`, `ee`, `[^aeiou]e`). I accept any sequence of those, with letters and `'`. A condition is matched at the end of the word for a suffix and at the start for a prefix, before stripping, as Hunspell does.
   - **Cross-product:** a prefix and a suffix combine only when both groups say `Y` (`SFX V`, `H` and `T` say `N`). One prefix and one suffix at most, because rules can't add further flags here.
   - **Strip:** `0` or letters, for suffixes. A rule that would strip the whole word isn't applied (Hunspell without `FULLSTRIP`).
   - **Directives that don't change which words exist** are ignored on purpose: `TRY`, `REP`, `ICONV` (suggestions and input conversion), `WORDCHARS` (splitting text into words), and `COMPOUNDMIN`, `ONLYINCOMPOUND`, `COMPOUNDRULE` (see below). `SET` must be `UTF-8`. `NOSUGGEST` names the taboo flag (choice 7).
   - **`unsupported-line`** for anything else, with its line number: any other directive (e.g. `FLAG`, `NEEDAFFIX`, `KEEPCASE`, `CIRCUMFIX`, `FULLSTRIP`); `SET` other than `UTF-8`; a `NOSUGGEST` that isn't one character; an affix header whose cross-product isn't `Y`/`N` or whose count isn't a number; a group with more or fewer rules than its header says; a rule that adds further flags (`s/M`) or has extra fields; a condition outside the forms above; a prefix rule that strips letters. In the `.dic`: a first line that isn't the entry count, and an entry with extra fields (morphology).
   - **Compounding isn't generated.** Compound rules join only entries carrying compound flags, and in these files those are the number entries (`0/nm`, `1st/p`, `1th/tc`), whose words all contain digits. So ignoring compounds loses no word. To keep that true, flags are checked on every entry whose word is letters a–z (any case): a flag no affix rule or `NOSUGGEST` defines is `unknown-flag`. Entries that contain a non-letter are dropped whole, and their flags aren't checked.

4. **Possessives: dropped by the letters filter, not by skipping the `'s` rule.** Every form, from any entry or rule, is kept only if it's letters a–z. That drops `cold's`, `I'd` and `café` with one check. Skipping the rule by name (`M`) would depend on a flag letter that a new release could change, and would still need the filter for entries like `I'd`. Tested with a possessive rule on `cold/MS`.

5. **Capitals: decided per word form, after expanding endings.** A form is kept only if it's already lowercase a–z (`normaliseWord` accepts it and doesn't change it). Affixes here are all lowercase, so a capitalised entry only makes capitalised forms, and the result is the same as deciding per entry. Doing it per form needs one check, which also catches capitals inside a word (`eBay`).
   - `Polish/M` makes `Polish` and `Polish's`: both dropped. `polish/ZGDRS` makes `polish`, `polished`, `polisher`, `polishers`, `polishes`, `polishing`: all kept.
   - **Note on the backlog's `Bach`:** `en_GB-large` also has a lowercase `bach/GDS`, so the real list keeps `bach` (and `bached`, `baches`, `baching`), as it keeps `polish`. The fixture test uses `Bach` alone. `Avon` has no lowercase entry, so it goes.

6. **Roman numerals: a word form is dropped if it's a valid Roman numeral in standard form**, checked by one regular expression in the code: `^m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$`, not empty. Tests check it with hand-picked numerals and non-numerals.
   - Backlog examples: `xiii` (13) and `clix` (159) go; `mild`, `mill`, `dill` stay, because `i` can only come before `v` or `x`, and `ll` isn't allowed. Edge words: `lid`, `dim`, `vim`, `civil` stay for the same reason.
   - **`mix` stays, as a listed exception** (your decision at the review stop). `mix` is 1009 in standard form, but it's a real English word. The code holds a one-word keep-list, `mix`, beside the numeral pattern, with a comment saying why. The keep-list exempts a word from the numeral rule only; it never adds a word the dictionary doesn't have.
     - In these files the other real words that are valid numerals are the 2-letter `xi`, `mi`, `li` and `di` (plus abbreviations like `mm`, `cd`, `div`). They still go: no ladder uses 2-letter words yet. Add them to the keep-list if that changes.
     - **No 4-letter word is affected either way**: every 4-letter numeral entry (`clix`, `lvii`, `xciv`, …) is a numeral only.
     - Not chosen: dropping a numeral only when its entry has no affix flags. That keeps `mix/AGDS` with no list, but it also keeps `lix/K` and `iv/U`, and it would break if SCOWL added a flag to a numeral entry.
   - Checked per word form, so endings added to a numeral entry survive: `lix/K` makes `prolix`, which stays; `lix` goes.

7. **Taboo: SCOWL's `NOSUGGEST` flag.** The README says "The NOSUGGEST flag was added to certain taboo words", and both `.aff` files declare `NOSUGGEST !`. 31 entries in `en_GB-large` and 27 in `en_GB-ise` carry it. The flag is read from the `NOSUGGEST` line, not hard-coded. Every form of a flagged entry is dropped, **even if another entry also makes that form**: for an offensive-words filter, dropping wins. (In these files no flagged word has an unflagged entry; I haven't checked whether their other forms collide.) If a release stops declaring `NOSUGGEST`, its `!` entries become `unknown-flag`.

8. **Exclusion list and blocklist format** (for 6.2 and 6.3): UTF-8 text, one word per line. Spaces around a word are trimmed, blank lines are skipped, and a line starting with `#` is a comment. Words may be in any case and are compared in lowercase. A line that isn't one word a–z after that is `invalid-word`, so a typo can't fail to block quietly. Empty text is an empty list: every fixture test passes `""` for both, so that's covered without a separate test.
   - **Exact forms only:** excluding `govt` doesn't exclude `govts`. 6.2 and 6.3 must list each form they want gone. Taboo is different because the flag is on the entry (choice 7).
   - Words on a list that aren't in the dictionary are ignored. Spotting a list word that matches nothing is 6.2's job.

9. **Smoke check on the real files: yes, three tests for each dictionary**, in a separate file so the fixture tests stay readable. Not a snapshot: no counts, no full list.
   - The real file reads with no `unsupported-line` or `unknown-flag`, and `cold/MRYTPS` gives `cold`, `colder`, `coldest`, `coldly`, `coldness`, `colds` but not `cold's` (worked out by hand from the rules).
   - Spot checks of the cleaning: `polish` and `prolix` are in; `Avon`/`avon`, `xiii`, `clix` are out.
   - Property: every word is lowercase a–z, listed once, in order.
   - Taboo isn't spot-checked on real data, because the test would have to spell the words out. The fixture tests cover the rule; 6.3 checks the built lists.
   - In self-review, I'll also compare the 4-letter counts with D17's spike (2,692 at size 60, 3,433 at size 70, before the exclusion list and blocklist) and record the difference in `plan.md`. That's evidence, not a test.

10. **Size:** about 170 lines of source and about 750 of tests (46 fixture tests, 3 smoke tests run on both dictionaries), plus small config edits. That's well over the ~200 guide, mostly tests: each guard in `unsupported-line` needs its own test for 100% branch coverage and for the breaks. I'd keep it as one chunk: the parser and its error reporting don't make sense apart. If you'd rather trim, the cheapest cut is to merge some `unsupported-line` tests (e.g. header cross-product and count) and accept that one of each pair's breaks stays green.

## What I'm least sure of
- **Matching Hunspell exactly.** Nothing here compares the output with real Hunspell (`unmunch` isn't installed). I've matched its rules as I understand them: condition checked before stripping, no whole-word strip, prefix condition checked against the word it's added to (the suffixed form, when combined; with every real prefix condition `.`, that can't differ). What would change my mind: a big gap against D17's spike counts in self-review, or a reviewer who knows Hunspell's code reading it differently.
- **The numeral keep-list** (choice 6). It holds only `mix`, picked by hand from these two files. A future SCOWL release could add another real word that's also a numeral, and nothing would flag it; it would just be dropped. Since that can't touch a 4-letter list, I've left it as a known gap rather than adding a check.
- **Extending D21's lint to `scripts/words/` inside a code chunk** (choice 1). It's config, not `CLAUDE.md` or `sdlc/README.md`, so I read it as allowed here, but it does widen a decided rule. If you see it as a process change, I'd move the config edit to its own PR first.

## Out of scope
- Keeping 4-letter words, the largest cloud, writing `accepted-4.txt` and `puzzle-4.txt`, and how the build script runs (Node's type stripping or a runner): 6.1b
- Choosing excluded words and the blocklist source: 6.2, 6.3
- Generating compound words (ordinals like `21st`): not needed, see choice 3
- Accented words (`café`): dropped as non-letters, as `normaliseWord` rejects them
