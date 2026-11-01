import { describe, expect, it } from "vitest";
import { getWordLists } from "../../../scripts/words/getWordLists";

// Chunk 6.1b. Rules: accepted words are the largest Word Cloud of the size-70
// list (en_GB-large); puzzle words are size-60 words (en_GB-ise) that are also
// accepted words, so every puzzle is solvable (D8, D17). Words are 4 letters,
// but length is a parameter (D4). An expected failure returns a reason (CLAUDE.md,
// Conventions), naming the list it came from so the build can print the file.

function joinLines(...lines: string[]): string {
  return lines.join("\n");
}

// A .dic file is its entry count, then one entry per line. No affix rules.
function createSource(...entries: string[]) {
  return { affixText: "", dictionaryText: joinLines(String(entries.length), ...entries) };
}

const emptyLists = { exclusionListText: "", blocklistText: "" };

describe("getWordLists: accepted words", () => {
  it("accepted words are the largest 4-letter Word Cloud of the size-70 list", () => {
    // Arrange
    // cold-cord-card-ward-warm is the largest cloud; opal-oral is smaller and
    // colds has 5 letters.
    const input = {
      acceptedWordsSource: createSource(
        "card",
        "cold",
        "colds",
        "cord",
        "opal",
        "oral",
        "ward",
        "warm",
      ),
      puzzleWordsSource: createSource("cold"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      acceptedWords: ["card", "cold", "cord", "ward", "warm"],
    });
  });

  it("builds the lists for the word length asked for", () => {
    // Arrange
    // cat-cot-cog-dog is the largest 3-letter cloud; the 4-letter words are left out.
    const input = {
      acceptedWordsSource: createSource("cat", "cog", "cold", "cord", "card", "cot", "dog"),
      puzzleWordsSource: createSource("cat", "cold"),
      ...emptyLists,
      wordLength: 3,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toEqual({
      ok: true,
      acceptedWords: ["cat", "cog", "cot", "dog"],
      puzzleWords: ["cat"],
    });
  });

  it("removes an excluded word before finding the cloud, so words joined only through it drop out", () => {
    // Arrange
    // Without card, bold-cold-cord (3) and ward-warm (2) are separate clouds.
    const input = {
      acceptedWordsSource: createSource("bold", "card", "cold", "cord", "ward", "warm"),
      puzzleWordsSource: createSource("cold"),
      exclusionListText: "card",
      blocklistText: "",
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({ ok: true, acceptedWords: ["bold", "cold", "cord"] });
  });

  it("removes a blocked word before finding the cloud, so words joined only through it drop out", () => {
    // Arrange
    const input = {
      acceptedWordsSource: createSource("bold", "card", "cold", "cord", "ward", "warm"),
      puzzleWordsSource: createSource("cold"),
      exclusionListText: "",
      blocklistText: "card",
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({ ok: true, acceptedWords: ["bold", "cold", "cord"] });
  });
});

describe("getWordLists: puzzle words", () => {
  it("puzzle words are size-60 words that are also accepted words", () => {
    // Arrange
    // The size-60 list has cold, ward and zinc; zinc isn't in the size-70 list.
    const input = {
      acceptedWordsSource: createSource("card", "cold", "cord", "ward", "warm"),
      puzzleWordsSource: createSource("cold", "ward", "zinc"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({ ok: true, puzzleWords: ["cold", "ward"] });
  });

  it("leaves out a size-60 word that is in the size-70 list but outside its largest cloud", () => {
    // Arrange
    // oral is in both lists, but its cloud (opal-oral) is not the largest.
    const input = {
      acceptedWordsSource: createSource("card", "cold", "cord", "opal", "oral", "ward", "warm"),
      puzzleWordsSource: createSource("cold", "oral"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({ ok: true, puzzleWords: ["cold"] });
  });

  it("keeps size-60 words that only size-70 words join together", () => {
    // Arrange
    // cold and warm aren't joined within the size-60 list, but cord, card and
    // ward join them in the size-70 cloud (D17: size 70 reconnects words like high).
    const input = {
      acceptedWordsSource: createSource("card", "cold", "cord", "ward", "warm"),
      puzzleWordsSource: createSource("cold", "warm"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toMatchObject({ ok: true, puzzleWords: ["cold", "warm"] });
  });
});

describe("getWordLists: failures", () => {
  it("reports the size-70 list, file and line when its dictionary can't be read", () => {
    // Arrange
    // Line 3 uses flag Z, which no affix rule defines.
    const input = {
      acceptedWordsSource: createSource("cold", "cord/Z"),
      puzzleWordsSource: createSource("cold"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toEqual({
      ok: false,
      wordList: "accepted",
      reason: "unknown-flag",
      file: "dictionary",
      lineNumber: 3,
    });
  });

  it("reports the size-60 list, file and line when its dictionary can't be read", () => {
    // Arrange
    const input = {
      acceptedWordsSource: createSource("cold", "cord"),
      puzzleWordsSource: createSource("cold/Z"),
      ...emptyLists,
      wordLength: 4,
    };

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result).toEqual({
      ok: false,
      wordList: "puzzle",
      reason: "unknown-flag",
      file: "dictionary",
      lineNumber: 2,
    });
  });
});
