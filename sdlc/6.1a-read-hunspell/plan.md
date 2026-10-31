# 6.1a plan

## Approach
One pure function in one file, with small private helpers. Nothing reads a file.
1. **Affix file**, line by line (split on `\r?\n`, trimmed, blank and `#` lines skipped, fields split on whitespace). Known directives that don't change which words exist are ignored (intent choice 3). `SET` must be `UTF-8`. `NOSUGGEST` gives the taboo flag. `PFX`/`SFX`: a line is a header when no group for that flag is open, otherwise a rule. A header needs `Y`/`N` and a whole-number count; a rule needs exactly the five fields, an add with no `/`, a readable condition and, for a prefix, strip `0`. When a header's count runs out the group closes, and a group still open at the end of the file is reported at its header line. Anything else is `unsupported-line`.
   - A condition is checked with one pattern (`.`, a letter or `'`, `[...]`, `[^...]`, repeated) and then used directly as a regular expression, anchored with `$` for a suffix and `^` for a prefix: Hunspell's condition syntax is a subset of regular-expression syntax with the same meaning.
2. **Exclusion list and blocklist**: each line trimmed; blank and `#` lines skipped; the rest through `normaliseWord`, which lowercases. A line it rejects is `invalid-word` with that list's name and line number.
3. **Dictionary**: line 1 must be a whole number. Each later non-blank line is `word` or `word/flags`, with no whitespace inside. If the word is letters a–z in any case, every flag must be an affix flag or the taboo flag, or it's `unknown-flag`.
4. **Forms of an entry**: the word itself; each suffix rule whose condition matches the word's end, when stripping leaves at least one letter; each prefix rule whose condition matches the start; and, for each prefix and suffix pair whose groups both say `Y`, the prefix added to the suffixed form.
5. **Keep a form** if `normaliseWord` accepts it and returns it unchanged (lowercase a–z), it isn't a Roman numeral (unless it's on the one-word keep-list, `mix`), and it isn't on either list. Forms of taboo entries go into a separate set, removed at the end (intent choice 7).
6. Return the kept words sorted with the default sort, as `createDictionaryFromWords` does.

Config, so `scripts/` is checked like `src/` (intent choice 1):
- `tsconfig.json`: add `"scripts"` to `include`.
- `eslint.config.js`: the purity block covers `src/core/**/*.ts` and `scripts/words/**/*.ts`, with messages reworded from "src/core" to "pure code"; the yes/no naming block covers `scripts/**/*.ts` as well as `src/**/*.ts`.

## Files
- `scripts/words/getWordsFromHunspell.ts`: new, 305 lines (237 without comments and blank lines; the estimate was 170, before Prettier split the long conditions and types)
- `tests/scripts/words/getWordsFromHunspell.test.ts`: new, 54 tests (3 added after approval, see Self-review; 5 after review, see `review.md`)
- `tests/scripts/words/getWordsFromHunspell.scowl.test.ts`: new, 3 tests × 2 dictionaries, 68 lines
- `tsconfig.json`, `eslint.config.js`: as above, a few lines each
- `backlog.md`: Word lists status; *Carried forward* lines on 6.1b (what it calls) and 6.2 (abbreviations made by prefixes)
- `sdlc/6.1a-read-hunspell/`: these records

About 1,100 lines in all, against the ~200 guide; see intent choice 10.

## Tests
Fixtures are short `.aff`/`.dic` strings in each test, with rules copied from SCOWL's files where they exist there. Every fixture test passes `""` for the lists unless it tests them.

**Endings**

| Test | Input | Expected | Rule |
|---|---|---|---|
| expands words with their Hunspell endings (cold/S gives colds) | `SFX S 0 s [^sxzhy]`; `cold/S` | `cold, colds` | Expand endings (D17) |
| removes letters from the word before adding an ending (carry/S gives carries) | `SFX S y ies [^aeiou]y`; `carry/S` | `carries, carry` | Expand endings: strip |
| removes letters only when the word ends with them (cold/D does not give colied) *(added after approval)* | `SFX D y ied .`; `cold/D, cry/D` | `cold, cried, cry` | Expand endings: strip must match |
| adds an ending only to words that meet its condition (box/S gives boxes, not boxs) | SCOWL's 4-line S rule; `box, carry, cold, play` | `box, boxes, carries, carry, cold, colds, play, plays` | Expand endings: conditions |
| checks a condition of more than one letter (hate/B gives hatable, toe/B gives nothing) | SCOWL's B rule; `free, hate, toe` | `free, freeable, hatable, hate, toe` | Expand endings: `ee`, `[^aeiou]e` |
| does not apply an ending that would remove the whole word (e/G does not give ing) | `SFX G e ing e`; `e/G, hate/G` | `e, hate, hating` | Match Hunspell (no `FULLSTRIP`) |
| applies an ending that leaves one letter of the word (ye/G gives ying) *(after review 4)* | `SFX G e ing e`; `ye/G` | `ye, ying` | Whole-word guard, other side |
| adds prefixes (tie/U gives untie) | `PFX U 0 un .`; `tie/U` | `tie, untie` | Expand endings: prefixes |
| adds a prefix only to words that meet its condition (possible/I gives impossible) | `PFX I 0 im p`, `PFX I 0 in [^p]`; `active, possible` | `active, impossible, inactive, possible` | Prefix conditions, matched at the start |
| combines a prefix and an ending when both allow it (tie/UD gives untied) | `PFX U … Y`, `SFX D … Y`; `tie/UD` | `tie, tied, untie, untied` | Cross-product |
| does not combine a prefix with an ending whose group says N | suffix group `N` | `tie, tied, untie` | Cross-product: suffix side |
| does not combine an ending with a prefix whose group says N | prefix group `N` | `tie, tied, untie` | Cross-product: prefix side |
| ignores affix lines that don't change which words exist | every such SCOWL directive, a comment, a blank line; `cold` | `cold` | Intent choice 3 |

**Cleaning**

| Test | Input | Expected | Rule |
|---|---|---|---|
| does not add possessive forms (cold's) | `SFX M 0 's .`, S; `cold/MS` | `cold, colds` | No apostrophes (D8) |
| drops words that only appear capitalised (Bach, Avon) | `Avon/M, Bach/M, cold` | `cold` | Lowercase only (D17) |
| keeps a word that has both a capitalised and a lowercase entry (polish) | M, D, S; `Polish/M, polish/DS` | `polish, polished, polishes` | Lowercase only, per form (intent 5) |
| drops words with a capital letter after the first (eBay) | `cold, eBay` | `cold` | Lowercase only (D17) |
| drops entries containing non-letters (I'd, café, co-op) | `I'd, café, co-op, cold` | `cold` | a–z only (CLAUDE.md, D8) |
| ignores compound flags on entries that are not words (1st/p) | `COMPOUNDRULE`; `1st/p, cold` | `cold` (no `unknown-flag`) | Intent choice 3 |
| drops Roman numerals (xiii, clix) | `clix, cold, xiii` | `cold` | No Roman numerals (D17) |
| keeps mix, a real word that is also a Roman numeral | `mix, xi` | `mix` | Keep-list holds `mix` only (intent 6) |
| keeps real words made of Roman numeral letters (mild, mill, dill, lid, dim, civil, vim) | those seven | all seven | Only real numerals go |
| keeps a word made by adding to a Roman numeral (lix/K gives prolix) | `PFX K 0 pro .`; `lix/K` | `prolix` | Per form, not per entry (intent 6) |
| drops words on the exclusion list (asap, govt) | list `asap, govt`; `asap, cold, govt` | `cold` | Exclusion list (D17) |
| reads the exclusion list in any case, skipping spaces, blank lines and # comments | list `# …`, blank, `  GOVT  ` | `cold` | List format (intent 8) |
| drops only the exact word on the exclusion list, not its other forms | list `cold`; `cold/S` | `colds` | List format (intent 8) |
| drops every form of a word SCOWL flags as taboo | `NOSUGGEST !`; `cold, darn/S!` | `cold` | Taboo (D17) |
| drops a taboo word even when another entry also makes it | `cold, darn/S!, darns` | `cold` | Taboo wins (intent 7) |
| drops the lowercase form of a capitalised taboo word *(after review 6)* | `Darn/!, cold, darn` | `cold` | Taboo wins, in any case (intent 7) |
| reads the taboo flag from the affix file's NOSUGGEST line | `NOSUGGEST X`; `cold, darn/X` | `cold` | Taboo flag not hard-coded |
| drops words on the blocklist | list `# …`, `DARN`; `cold, darn` | `cold` | Blocklist (D17) |

**Output and file format**

| Test | Input | Expected | Rule |
|---|---|---|---|
| lists each word once, in alphabetical order | `warm, cold/S, colds` | `cold, colds, warm` | Same inputs, same list (D6, 6.1b) |
| reads files with Windows line endings | `\r\n` in all files | `cold, colds` | Files checked out on Windows |

**Lines it does not support** (each expects `{ ok: false, reason, file, lineNumber }`)

| Test | Input | Expected | Rule |
|---|---|---|---|
| reports an affix directive it does not support (FLAG long) | `SET UTF-8`, `FLAG long` | `unsupported-line`, affix, 2 | No silent drops (intent 3) |
| reports an affix file that is not UTF-8 | `SET ISO8859-1` | affix, 1 | 〃 |
| reports a NOSUGGEST line that does not name one flag | `NOSUGGEST` | affix, 2 | 〃 |
| reports a NOSUGGEST line that names more than one flag *(after review 5)* | `NOSUGGEST !X` | affix, 1 | 〃 |
| reports a second affix group for a flag already defined *(after review 1)* | two `SFX S` groups | affix, 3 | 〃 |
| reports an affix header whose cross-product is not Y or N | `SFX S X 1` | affix, 1 | 〃 |
| reports an affix header whose rule count is not a number *(strengthened in self-review)* | `SFX S Y one`, then a D group | affix, 1 | 〃 |
| reports an affix group with fewer rules than its header says | count 2, one rule | affix, 1 | 〃 |
| reports an affix group with more rules than its header says | count 1, two rules | affix, 3 | 〃 |
| reports an affix rule inside another flag's group *(added after approval)* | S group of 2, then a D rule | affix, 3 | 〃 |
| reports a prefix rule inside a suffix group *(after review 2)* | `PFX S 0 un .` in an `SFX S` group | affix, 3 | 〃 |
| reports an affix rule that adds further flags (s/M) | `SFX S 0 s/M …` | affix, 2 | 〃 |
| reports an affix rule with extra fields | `… is:plural` | affix, 2 | 〃 |
| reports an affix condition it cannot read | `[^sxzhy` | affix, 2 | 〃 |
| reports a prefix rule that removes letters | `PFX U t un t` | affix, 2 | 〃 |
| reports a dictionary whose first line is not the entry count | `cold, warm` | dictionary, 1 | 〃 (else `cold` would be skipped) |
| reports a dictionary entry with extra fields | `cold/S po:adjective` | dictionary, 3 | 〃 |
| reports a flag that no affix rule defines (cold/Q) | `cold/SQ` | `unknown-flag`, dictionary, 3 | 〃 |
| reports a flag that no affix rule defines on a capitalised entry (Bach/Q) *(added in self-review)* | `Bach/Q` | `unknown-flag`, dictionary, 2 | Flags checked on every letters-only entry (intent 3) |
| reports an exclusion-list line that is not a word | `go vt` on line 2 | `invalid-word`, exclusion, 2 | List format (intent 8) |
| reports a blocklist line that is not a word | `d4rn` | `invalid-word`, blocklist, 1 | 〃 |

**Smoke check on the real files** (`describe.each` over `en_GB-large` and `en_GB-ise`, loaded with `?raw`)

| Test | Expected | Rule |
|---|---|---|
| reads the real files and expands cold/MRYTPS into the forms worked out by hand | ok; contains `cold, colder, coldest, coldly, coldness, colds`; not `cold's` | The real files use only supported rules |
| keeps polish, prolix and mix and drops Avon, xiii and clix from the real files | as named | Cleaning on real data |
| lists every word from the real files in lowercase a–z, once, in order | no word outside a–z; each word after the one before | Output shape (property) |

Notes for review:
- **Order of reasons** (affix, then lists, then dictionary) isn't tested: each fixture has one problem. It decides only which of two problems is reported first, and either stops the build.
- **"lists each word once…"** is the only test with input out of order; the others list entries alphabetically, as SCOWL does.
- **The smoke property uses `/^[a-z]+$/`**, the same pattern `normaliseWord` uses. That's a property check of the output, not a copy of the filtering logic.

## Self-review
The diff matches the intent and touches only the files listed. Lint passes. 179 tests pass, with 100% on all four coverage measures. Every break was restored.

**Changed after your approval** (the first two came from writing the code; the last two from the breaks):
- **Added** "removes letters only when the word ends with them". Hunspell needs both the condition and the strip letters to match. SCOWL's conditions always include the strip letters, so no approved test could tell, but a rule like `SFX D y ied .` would turn `cold` into `colied`.
- **Added** "reports an affix rule inside another flag's group". The code takes a group's rules from the lines after its header; without this check, a `D` rule inside an `S` group would quietly become an `S` rule.
- **Strengthened** "reports an affix header whose rule count is not a number". With the count check deleted, the group never closed and the end-of-file check reported the same line, so the break stayed green. A second group after it now decides which line is reported.
- **Added** "reports a flag that no affix rule defines on a capitalised entry (Bach/Q)". Intent choice 3 checks flags on every letters-only entry, in any case, but no test had a capitalised one.
- **Code simplified:** line splitting no longer handles `\r` itself, since every line is trimmed anyway; the Windows test now protects the trim. The header count pattern is `\d+`, not `[1-9]\d*`: a count of 0 is still reported, only on a different line, so the extra detail had no test.

**Real-file check (evidence, not a test).** Before the exclusion list and blocklist:

| | en_GB-ise (size 60) | en_GB-large (size 70) |
|---|---|---|
| All words | 79,217 | 129,560 |
| 4-letter words | 2,702 (spike: 2,692) | 3,445 (spike: 3,433) |
| Largest 4-letter cloud | 2,558 (spike: 2,550) | 3,318 (spike: 3,308) |
| Time on this PC | 60 ms | 131 ms |

The extra 10–12 words are almost all made by **prefixes**. With the `PFX` rules removed, these 4-letter words disappear:
- en_GB-large: `conc, conj, dept, into, intr, proa, pron, recd, rees, reft, reis, revs, unis, unit, univ, unto`
- en_GB-ise: `conj, dept, incs, into, prob, pron, revs, unis, unit, univ, unto`

`into`, `unto` and `unit` are real words that SCOWL lists only as `in`/`un` + `to`/`it`. Most of the rest are abbreviations made by a prefix on an abbreviation entry (`iv/U` gives `univ`, `cd/A` gives `recd`). Hunspell accepts them too, so this matches Hunspell; removing them is the exclusion list's job. I've put that on 6.2's backlog entry. The spike's numbers suggest it handled prefixes differently, but `into` was in its list, so I can't tell how.

**Breaks** (`npm run break`; 57 in all):
- *Endings:* suffix condition not anchored at the end → red: "only to words that meet its condition", "more than one letter" · prefix condition not anchored → red: "prefix only to words that meet its condition" · strip letters not removed → red: 8 tests · strip letters not checked at the end → red: "colied" · whole-word guard deleted, and off by one (`>=`) → red: "would remove the whole word" (both) · prefix added at the end → red: 5 tests
- *Cross-product:* only the prefix's group checked → red: "ending whose group says N" · only the suffix's → red: "prefix whose group says N" · always on → red: both · prefix never added to a suffix form → red: "combines" · prefix never added to the word → red: 5 tests
- *Capitals:* lowercased instead of dropped → red: smoke tests (`Avon`) · only the first letter checked → red: "eBay", smoke property · decided per entry (lowercase entries only) → red: "Bach/Q" *(after adding it)*
- *Numerals:* not dropped → red: "drops Roman numerals", "keeps mix", smoke · keep-list ignored → red: "keeps mix", smoke · pattern not anchored at the start → red: smoke (`cold` matches at `d`) · checked per entry, not per form → red: "prolix"
- *Lists:* exclusion list not applied → red: 4 tests · blocklist not applied → red: "drops words on the blocklist" · blocklist read from the exclusion text → red: 2 tests · blocklist failures named `exclusion` → red: "blocklist line that is not a word" · comments not skipped → red: smoke tests (`.aff` comments share the reader) · list lines not checked → red: both `invalid-word` tests
- *Taboo:* taboo forms kept when a clean entry makes them → red: "even when another entry also makes it" · flag hard-coded as `!` → red: "reads the taboo flag" · never detected → red: 3 tests · taboo flag treated as unknown → red: 3 taboo tests, smoke
- *Dictionary lines:* unknown flags not reported → red: "cold/Q" · flags checked on non-letter entries → red: "1st/p", smoke · count line not checked → red: "first line is not the entry count" · line numbers off by one → red: 2 tests · entry with spaces accepted → red: "extra fields" · line not trimmed → red: "Windows line endings"
- *Affix lines:* rule of another group accepted → red: "inside another flag's group" · prefix strip accepted → red: "prefix rule that removes letters" · open group at end of file accepted → red: "fewer rules" · group never closes → red: 32 tests · any `SET` → red: "not UTF-8" · any `NOSUGGEST` → red: "does not name one flag" · `TRY` not ignored → red: "ignores affix lines", smoke · header cross-product not checked → red: "not Y or N" · header count not checked → red: "not a number" *(after strengthening)* · rule add may carry flags → red: "s/M" · rule may have extra fields → red: "extra fields" · any condition accepted → red: "cannot read"
- *Output:* not sorted → red: 8 tests

**Breaks that stay green:**
- The numeral pattern loosened to allow `iiii` (`v?i*`). `iiii` isn't a standard numeral and isn't in either file, so this can't change the real output. Not tested.

Shell escaping ate the backslashes in my first break file, so five breaks were wrong on the first run (four not applied, one all green for the wrong reason). They were rewritten as plain JSON and rerun; the results above are from the reruns.
