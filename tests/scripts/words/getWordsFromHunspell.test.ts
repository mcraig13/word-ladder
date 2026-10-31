import { describe, expect, it } from "vitest";
import { getWordsFromHunspell } from "../../../scripts/words/getWordsFromHunspell";

// Chunk 6.1a. Rules: expand Hunspell endings; keep only lowercase words; drop
// Roman numerals, the exclusion list, SCOWL's taboo-flagged words and the
// blocklist (D17). Accepted words have no proper nouns, abbreviations or
// apostrophes (D8), and contain only a–z (CLAUDE.md, Moves). A rule the code
// doesn't support is reported, not skipped (6.1a intent, choice 3).
//
// Affix rules are copied from SCOWL's en_GB .aff files where they exist there.
// A .dic file starts with its entry count, which these fixtures give.

function joinLines(...lines: string[]): string {
  return lines.join("\n");
}

// No excluded or blocked words; tests of those lists pass their own text.
const emptyLists = { exclusionListText: "", blocklistText: "" };

describe("getWordsFromHunspell: endings", () => {
  it("expands words with their Hunspell endings (cold/S gives colds)", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold", "colds"] });
  });

  it("removes letters from the word before adding an ending (carry/S gives carries)", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S y ies [^aeiou]y");
    const dictionaryText = joinLines("1", "carry/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["carries", "carry"] });
  });

  it("removes letters only when the word ends with them (cold/D does not give colied)", () => {
    // Arrange
    // The condition "." allows any word, so only the strip letters decide.
    const affixText = joinLines("SFX D Y 1", "SFX D y ied .");
    const dictionaryText = joinLines("2", "cold/D", "cry/D");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold", "cried", "cry"] });
  });

  it("adds an ending only to words that meet its condition (box/S gives boxes, not boxs)", () => {
    // Arrange
    // SCOWL's S rule: "carry" takes -ies, "play" -s, "box" -es, "cold" -s.
    const affixText = joinLines(
      "SFX S Y 4",
      "SFX S y ies [^aeiou]y",
      "SFX S 0 s [aeiou]y",
      "SFX S 0 es [sxzh]",
      "SFX S 0 s [^sxzhy]",
    );
    const dictionaryText = joinLines("4", "box/S", "carry/S", "cold/S", "play/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: true,
      words: ["box", "boxes", "carries", "carry", "cold", "colds", "play", "plays"],
    });
  });

  it("checks a condition of more than one letter (hate/B gives hatable, toe/B gives nothing)", () => {
    // Arrange
    // "free" ends "ee" (rule 2); "hate" ends consonant + e (rule 3); "toe"
    // ends vowel + e, which no rule allows.
    const affixText = joinLines(
      "SFX B Y 3",
      "SFX B 0 able [^aeiou]",
      "SFX B 0 able ee",
      "SFX B e able [^aeiou]e",
    );
    const dictionaryText = joinLines("3", "free/B", "hate/B", "toe/B");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["free", "freeable", "hatable", "hate", "toe"] });
  });

  it("does not apply an ending that would remove the whole word (e/G does not give ing)", () => {
    // Arrange
    const affixText = joinLines("SFX G Y 1", "SFX G e ing e");
    const dictionaryText = joinLines("2", "e/G", "hate/G");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["e", "hate", "hating"] });
  });

  it("applies an ending that leaves one letter of the word (ye/G gives ying)", () => {
    // Arrange
    const affixText = joinLines("SFX G Y 1", "SFX G e ing e");
    const dictionaryText = joinLines("1", "ye/G");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["ye", "ying"] });
  });

  it("adds prefixes (tie/U gives untie)", () => {
    // Arrange
    const affixText = joinLines("PFX U Y 1", "PFX U 0 un .");
    const dictionaryText = joinLines("1", "tie/U");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["tie", "untie"] });
  });

  it("adds a prefix only to words that meet its condition (possible/I gives impossible)", () => {
    // Arrange
    const affixText = joinLines("PFX I Y 2", "PFX I 0 im p", "PFX I 0 in [^p]");
    const dictionaryText = joinLines("2", "active/I", "possible/I");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: true,
      words: ["active", "impossible", "inactive", "possible"],
    });
  });

  it("combines a prefix and an ending when both allow it (tie/UD gives untied)", () => {
    // Arrange
    const affixText = joinLines("PFX U Y 1", "PFX U 0 un .", "SFX D Y 1", "SFX D 0 d e");
    const dictionaryText = joinLines("1", "tie/UD");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["tie", "tied", "untie", "untied"] });
  });

  it("does not combine a prefix with an ending whose group says N", () => {
    // Arrange
    const affixText = joinLines("PFX U Y 1", "PFX U 0 un .", "SFX D N 1", "SFX D 0 d e");
    const dictionaryText = joinLines("1", "tie/UD");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["tie", "tied", "untie"] });
  });

  it("does not combine an ending with a prefix whose group says N", () => {
    // Arrange
    const affixText = joinLines("PFX U N 1", "PFX U 0 un .", "SFX D Y 1", "SFX D 0 d e");
    const dictionaryText = joinLines("1", "tie/UD");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["tie", "tied", "untie"] });
  });

  it("ignores affix lines that don't change which words exist", () => {
    // Arrange
    // Every such directive in SCOWL's en_GB .aff files, with a comment and a
    // blank line.
    const affixText = joinLines(
      "# Affix file",
      "",
      "SET UTF-8",
      "TRY esianrtolcdugmphbyfvkwzESIANRTOLCDUGMPHBYFVKWZ'",
      "ICONV 1",
      "ICONV ’ '",
      "COMPOUNDMIN 1",
      "ONLYINCOMPOUND c",
      "COMPOUNDRULE 1",
      "COMPOUNDRULE n*1t",
      "WORDCHARS 0123456789’",
      "REP 1",
      "REP a ei",
    );
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });
});

describe("getWordsFromHunspell: cleaning", () => {
  it("does not add possessive forms (cold's)", () => {
    // Arrange
    const affixText = joinLines("SFX M Y 1", "SFX M 0 's .", "SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/MS");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold", "colds"] });
  });

  it("drops words that only appear capitalised (Bach, Avon)", () => {
    // Arrange
    const affixText = joinLines("SFX M Y 1", "SFX M 0 's .");
    const dictionaryText = joinLines("3", "Avon/M", "Bach/M", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("keeps a word that has both a capitalised and a lowercase entry (polish)", () => {
    // Arrange
    // "Polish" and "Polish's" go; the lowercase entry's forms stay.
    const affixText = joinLines(
      "SFX M Y 1",
      "SFX M 0 's .",
      "SFX D Y 1",
      "SFX D 0 ed [^ey]",
      "SFX S Y 1",
      "SFX S 0 es [sxzh]",
    );
    const dictionaryText = joinLines("2", "Polish/M", "polish/DS");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["polish", "polished", "polishes"] });
  });

  it("drops words with a capital letter after the first (eBay)", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("2", "cold", "eBay");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops entries containing non-letters (I'd, café, co-op)", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("4", "I'd", "café", "co-op", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("ignores compound flags on entries that are not words (1st/p)", () => {
    // Arrange
    // SCOWL's number entries carry compound flags that no affix rule defines.
    const affixText = joinLines("COMPOUNDRULE 1", "COMPOUNDRULE n*mp");
    const dictionaryText = joinLines("2", "1st/p", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops Roman numerals (xiii, clix)", () => {
    // Arrange
    // 13 and 159 in standard form (intent choice 6).
    const affixText = "";
    const dictionaryText = joinLines("3", "clix", "cold", "xiii");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("keeps mix, a real word that is also a Roman numeral", () => {
    // Arrange
    // "mix" is 1009 and "xi" is 11. Only "mix" is on the keep-list, so "xi"
    // still goes (intent choice 6).
    const affixText = "";
    const dictionaryText = joinLines("2", "mix", "xi");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["mix"] });
  });

  it("keeps real words made of Roman numeral letters (mild, mill, dill, lid, dim, civil, vim)", () => {
    // Arrange
    // None is a numeral in standard form: "i" comes only before "v" or "x",
    // and "ll" never appears.
    const affixText = "";
    const dictionaryText = joinLines("7", "civil", "dill", "dim", "lid", "mild", "mill", "vim");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: true,
      words: ["civil", "dill", "dim", "lid", "mild", "mill", "vim"],
    });
  });

  it("keeps a word made by adding to a Roman numeral (lix/K gives prolix)", () => {
    // Arrange
    const affixText = joinLines("PFX K Y 1", "PFX K 0 pro .");
    const dictionaryText = joinLines("1", "lix/K");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["prolix"] });
  });

  it("drops words on the exclusion list (asap, govt)", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("3", "asap", "cold", "govt");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: joinLines("asap", "govt"),
      blocklistText: "",
    });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("reads the exclusion list in any case, skipping spaces, blank lines and # comments", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("2", "cold", "govt");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: joinLines("# abbreviations", "", "  GOVT  "),
      blocklistText: "",
    });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops only the exact word on the exclusion list, not its other forms", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: "cold",
      blocklistText: "",
    });

    // Assert
    expect(result).toEqual({ ok: true, words: ["colds"] });
  });

  it("drops every form of a word SCOWL flags as taboo", () => {
    // Arrange
    // "darn" stands in for a taboo word; SCOWL marks them with NOSUGGEST.
    const affixText = joinLines("NOSUGGEST !", "SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("2", "cold", "darn/S!");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops a taboo word even when another entry also makes it", () => {
    // Arrange
    const affixText = joinLines("NOSUGGEST !", "SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("3", "cold", "darn/S!", "darns");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops the lowercase form of a capitalised taboo word", () => {
    // Arrange
    const affixText = "NOSUGGEST !";
    const dictionaryText = joinLines("3", "Darn/!", "cold", "darn");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("reads the taboo flag from the affix file's NOSUGGEST line", () => {
    // Arrange
    const affixText = "NOSUGGEST X";
    const dictionaryText = joinLines("2", "cold", "darn/X");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });

  it("drops words on the blocklist", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("2", "cold", "darn");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: "",
      blocklistText: joinLines("# offensive words", "DARN"),
    });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold"] });
  });
});

describe("getWordsFromHunspell: output and file format", () => {
  it("lists each word once, in alphabetical order", () => {
    // Arrange
    // "colds" comes from "cold/S" and from its own entry.
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("3", "warm", "cold/S", "colds");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold", "colds", "warm"] });
  });

  it("reads files with Windows line endings", () => {
    // Arrange
    const affixText = "SFX S Y 1\r\nSFX S 0 s [^sxzhy]\r\n";
    const dictionaryText = "2\r\nasap\r\ncold/S\r\n";

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: "asap\r\n",
      blocklistText: "",
    });

    // Assert
    expect(result).toEqual({ ok: true, words: ["cold", "colds"] });
  });
});

describe("getWordsFromHunspell: lines it does not support", () => {
  it("reports an affix directive it does not support (FLAG long)", () => {
    // Arrange
    const affixText = joinLines("SET UTF-8", "FLAG long");
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports an affix file that is not UTF-8", () => {
    // Arrange
    const affixText = "SET ISO8859-1";
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 1 });
  });

  it("reports a NOSUGGEST line that does not name one flag", () => {
    // Arrange
    const affixText = joinLines("SET UTF-8", "NOSUGGEST");
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports a NOSUGGEST line that names more than one flag", () => {
    // Arrange
    const affixText = "NOSUGGEST !X";
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 1 });
  });

  it("reports a second affix group for a flag already defined", () => {
    // Arrange
    // The second group would otherwise replace the first, losing "colds".
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s .", "SFX S Y 1", "SFX S 0 es .");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 3 });
  });

  it("reports an affix header whose cross-product is not Y or N", () => {
    // Arrange
    const affixText = joinLines("SFX S X 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 1 });
  });

  it("reports an affix header whose rule count is not a number", () => {
    // Arrange
    // The D group after it means only the header can be the line reported.
    const affixText = joinLines(
      "SFX S Y one",
      "SFX S 0 s [^sxzhy]",
      "SFX D Y 1",
      "SFX D 0 ed [^ey]",
    );
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 1 });
  });

  it("reports an affix group with fewer rules than its header says", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 2", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 1 });
  });

  it("reports an affix group with more rules than its header says", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]", "SFX S 0 es [sxzh]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 3 });
  });

  it("reports an affix rule inside another flag's group", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 2", "SFX S 0 s [^sxzhy]", "SFX D 0 ed [^ey]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 3 });
  });

  it("reports a prefix rule inside a suffix group", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 2", "SFX S 0 s [^sxzhy]", "PFX S 0 un .");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 3 });
  });

  it("reports an affix rule that adds further flags (s/M)", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s/M [^sxzhy]");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports an affix rule with extra fields", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy] is:plural");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports an affix condition it cannot read", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy");
    const dictionaryText = joinLines("1", "cold/S");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports a prefix rule that removes letters", () => {
    // Arrange
    const affixText = joinLines("PFX U Y 1", "PFX U t un t");
    const dictionaryText = joinLines("1", "tie/U");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsupported-line", file: "affix", lineNumber: 2 });
  });

  it("reports a dictionary whose first line is not the entry count", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("cold", "warm");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "unsupported-line",
      file: "dictionary",
      lineNumber: 1,
    });
  });

  it("reports a dictionary entry with extra fields", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("2", "warm", "cold/S po:adjective");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "unsupported-line",
      file: "dictionary",
      lineNumber: 3,
    });
  });

  it("reports a flag that no affix rule defines (cold/Q)", () => {
    // Arrange
    const affixText = joinLines("SFX S Y 1", "SFX S 0 s [^sxzhy]");
    const dictionaryText = joinLines("2", "warm/S", "cold/SQ");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "unknown-flag",
      file: "dictionary",
      lineNumber: 3,
    });
  });

  it("reports a flag that no affix rule defines on a capitalised entry (Bach/Q)", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("1", "Bach/Q");

    // Act
    const result = getWordsFromHunspell({ affixText, dictionaryText, ...emptyLists });

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "unknown-flag",
      file: "dictionary",
      lineNumber: 2,
    });
  });

  it("reports an exclusion-list line that is not a word", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: joinLines("asap", "go vt"),
      blocklistText: "",
    });

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word", file: "exclusion", lineNumber: 2 });
  });

  it("reports a blocklist line that is not a word", () => {
    // Arrange
    const affixText = "";
    const dictionaryText = joinLines("1", "cold");

    // Act
    const result = getWordsFromHunspell({
      affixText,
      dictionaryText,
      exclusionListText: "",
      blocklistText: "d4rn",
    });

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word", file: "blocklist", lineNumber: 1 });
  });
});
