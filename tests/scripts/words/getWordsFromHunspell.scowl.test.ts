import { describe, expect, it } from "vitest";
import { getWordsFromHunspell } from "../../../scripts/words/getWordsFromHunspell";
import largeAffixText from "../../../data/source/scowl/en_GB-large/en_GB-large.aff?raw";
import largeDictionaryText from "../../../data/source/scowl/en_GB-large/en_GB-large.dic?raw";
import iseAffixText from "../../../data/source/scowl/en_GB-ise/en_GB-ise.aff?raw";
import iseDictionaryText from "../../../data/source/scowl/en_GB-ise/en_GB-ise.dic?raw";

// Chunk 6.1a smoke check on the real SCOWL files (D17). Not a snapshot: the
// expected words are worked out by hand from single entries, and the last test
// checks a property of every word. The fixture tests cover each rule.

const dictionaries = [
  { name: "en_GB-large", affixText: largeAffixText, dictionaryText: largeDictionaryText },
  { name: "en_GB-ise", affixText: iseAffixText, dictionaryText: iseDictionaryText },
];

describe.each(dictionaries)("getWordsFromHunspell on $name", ({ affixText, dictionaryText }) => {
  it("reads the real files and expands cold/MRYTPS into the forms worked out by hand", () => {
    // Arrange
    // R gives colder, T coldest, Y coldly, P coldness, S colds; M gives
    // cold's, which is dropped.
    const input = { affixText, dictionaryText, exclusionListText: "", blocklistText: "" };

    // Act
    const result = getWordsFromHunspell(input);

    // Assert
    const words = result.ok ? result.words : [];
    expect(result.ok).toBe(true);
    expect(words).toEqual(
      expect.arrayContaining(["cold", "colder", "coldest", "coldly", "coldness", "colds"]),
    );
    expect(words).not.toContain("cold's");
  });

  it("keeps polish, prolix and mix and drops Avon, xiii and clix from the real files", () => {
    // Arrange
    const input = { affixText, dictionaryText, exclusionListText: "", blocklistText: "" };

    // Act
    const result = getWordsFromHunspell(input);

    // Assert
    const words = result.ok ? result.words : [];
    expect(words).toEqual(expect.arrayContaining(["polish", "prolix", "mix"]));
    for (const droppedWord of ["Avon", "avon", "xiii", "clix"]) {
      expect(words).not.toContain(droppedWord);
    }
  });

  it("lists every word from the real files in lowercase a–z, once, in order", () => {
    // Arrange
    const input = { affixText, dictionaryText, exclusionListText: "", blocklistText: "" };

    // Act
    const result = getWordsFromHunspell(input);

    // Assert
    const words = result.ok ? result.words : [];
    const wordsNotLowercase = words.filter((word) => !/^[a-z]+$/.test(word));
    const wordsNotAfterThePreviousWord = words.filter(
      (word, position) => position > 0 && word <= (words[position - 1] ?? ""),
    );
    expect(words.length).toBeGreaterThan(0);
    expect(wordsNotLowercase).toEqual([]);
    expect(wordsNotAfterThePreviousWord).toEqual([]);
  });
});
