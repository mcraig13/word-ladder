import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";

// Chunk 1.2. Rules: every word in a chain must be an accepted word; words are
// compared in lowercase; a word contains only a–z (CLAUDE.md, D17).

describe("createDictionaryFromWords", () => {
  it("recognises a word that is in the list", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = dictionary.containsWord("cord");

    // Assert
    expect(result).toBe(true);
  });

  it("does not recognise a word that is not in the list", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = dictionary.containsWord("card");

    // Assert
    expect(result).toBe(false);
  });

  it("recognises a word whatever case it is looked up in", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold"]);

    // Act
    const result = dictionary.containsWord("COLD");

    // Assert
    expect(result).toBe(true);
  });

  it("recognises a word whatever case it was listed in", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["Cold"]);

    // Act
    const result = dictionary.containsWord("cold");

    // Assert
    expect(result).toBe(true);
  });

  it("ignores entries that are not valid words", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "c0ld", "co-d", "co d", ""]);

    // Act
    const result = dictionary.getWordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold"]);
  });

  it("lists only words of the requested length", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cat", "cold", "cord", "colds"]);

    // Act
    const result = dictionary.getWordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord"]);
  });

  it("lists each word once even when the list repeats it", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "COLD", "cord", "cold"]);

    // Act
    const result = dictionary.getWordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord"]);
  });

  it("lists words in alphabetical order whatever order they were given in", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["warm", "cord", "cold"]);

    // Act
    const result = dictionary.getWordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord", "warm"]);
  });
});
