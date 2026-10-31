# 6.1a review

**Reviewer:** independent agent, fresh context · **Verdict:** approve with changes → all findings answered, see responses

The reviewer found that the parser does what the intent says and stays in scope. The tests follow `CLAUDE.md`, every acceptance criterion has a test, and type-check, ESLint, Prettier and all tests passed in their scratch copy, with 100% coverage. The main gap was one more way to drop words without reporting them.

**Tests changed after human review** (all respond to findings below; each fix was confirmed to turn the reviewer's break red with `npm run break`):
- New: "reports a second affix group for a flag already defined" (finding 1)
- New: "reports a prefix rule inside a suffix group" (finding 2)
- New: "applies an ending that leaves one letter of the word (ye/G gives ying)" (finding 4)
- New: "reports a NOSUGGEST line that names more than one flag" (finding 5)
- New: "drops the lowercase form of a capitalised taboo word" (note 6)

The tests added or strengthened in self-review, before this review, are listed in `plan.md`.

## Findings
1. **should fix** A second affix group with an existing flag silently replaces the first group. In `readAffixFile`, `rulesByFlag.set(flag, rules)` overwrites any group already stored under that flag, with no report. Two probes, run:
   - `SFX S Y 1 / SFX S 0 s . / SFX S Y 1 / SFX S 0 es .` with `cold/S` gives `["cold", "coldes"]`, so `colds` is lost.
   - `PFX A … re` then `SFX A … s` on `cold/A` gives `["cold", "colds"]`, so `recold` is lost.

   Today's `.aff` files have no repeated flags (checked), so the real output is unaffected. But this is exactly the "a new SCOWL release can't drop words quietly" case that intent choice 3 guards against. — *Response:* **Fixed.** A header whose flag already has a group is `unsupported-line`, whatever its kind, so both probes are reported. Added "reports a second affix group for a flag already defined" (line 3). Deleting the check turns it red.
2. **should fix** No test checks that a rule's `PFX`/`SFX` matches its group's header. Deleting `kind === openGroup.kind &&` from `isRuleOfOpenGroup` leaves every test green. With that break, a `PFX S …` line inside an `SFX S` group would be read as a suffix rule. — *Response:* **Fixed.** Added "reports a prefix rule inside a suffix group" (`PFX S 0 un .` inside an `SFX S` group, line 3). The reviewer's break now turns it red.
3. **nit** `backlog.md` is listed in `plan.md` Files but isn't in commit `0182812`. — *Response:* **Fixed.** Committed with these responses: the Word lists status and the 6.1b and 6.2 *Carried forward* lines.
4. **nit** The "would remove the whole word" guard is tested on one side of the boundary only. `> rule.strip.length + 1` leaves every test green. — *Response:* **Fixed.** Added "applies an ending that leaves one letter of the word (ye/G gives ying)". The reviewer's break now turns it red.
5. **nit** `NOSUGGEST` with more than one character isn't covered; `>= 1` stays green. — *Response:* **Fixed.** Added "reports a NOSUGGEST line that names more than one flag" (`NOSUGGEST !X`). The reviewer's break now turns it red.
6. **note** Taboo matching is case-sensitive: `Darn/!` plus a lowercase `darn` gives `["darn"]`. Intent choice 7 says dropping wins when entries collide, but a capitalised taboo entry doesn't drop the lowercase word. No effect in these files. — *Response:* **Fixed rather than carried forward.** Taboo forms are stored lowercased, so a capitalised taboo entry also drops its lowercase twin. That's what choice 7's "dropping wins" means for an offensive-words filter, and intent choice 7 now says so. Added "drops the lowercase form of a capitalised taboo word". The real output is unchanged: the smoke tests and counts are the same, as the reviewer found.

**Notes:**
- The scope matches the plan, apart from finding 3.
- The `tsconfig`/ESLint changes are small, and the messages read correctly for both folders.
- Naming follows `CLAUDE.md`.
- A UTF-8 BOM at the start of any of the four inputs is handled, because `trim()` removes it (run).
- An empty `.dic` gives `unsupported-line` on dictionary line 1 (run).
- Tabs and repeated spaces in `.aff` lines are accepted (run).
- An add of `0` or an uppercase add is reported, not skipped (run).
- A dictionary count that doesn't match the number of entries is ignored, as Hunspell ignores it (run).
- The order in which failure reasons are checked isn't tested, as `plan.md` already says (confirmed by break 7 below).

## Reviewer's own break-the-code checks
Run with `npm run break` in a scratch copy:
1. Taboo applied only to the bare entry word, not its forms (`isTaboo && form === word`) → red: "drops every form of a word SCOWL flags as taboo", "drops a taboo word even when another entry also makes it"
2. Wrong input: list stores the raw line instead of the lowercased word (`words.add(text)`) → red: "reads the exclusion list in any case…", "drops words on the blocklist"
3. Wrong input: cross-product adds the prefix to the root instead of the suffixed form → red: "combines a prefix and an ending when both allow it"
4. Delete guard: rule kind not checked against its group header → **all green** *(finding 2; now red)*
5. Change in place: `NOSUGGEST` accepts any non-empty value → **all green** *(finding 5; now red)*
6. Skip trim: dictionary count line not trimmed → red: "reads files with Windows line endings"
7. Reorder: dictionary count line checked before the lists → **all green** (expected; `plan.md` says reason order is untested)
8. Off-by-one: whole-word strip guard requires two letters to remain → **all green** *(finding 4; now red)*
