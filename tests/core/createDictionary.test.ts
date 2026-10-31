import { describe, expect, it } from "vitest";
import { createDictionary } from "../../src/core/createDictionary";

// Chunk 1.2. Rules: every word in a chain must be an accepted word; words are
// compared in lowercase; a word contains only a–z (CLAUDE.md, D17).

describe("createDictionary", () => {
  it("recognises a word that is in the list", () => {
    // Arrange
    const dictionary = createDictionary(["cold", "cord"]);

    // Act
    const result = dictionary.has("cord");

    // Assert
    expect(result).toBe(true);
  });

  it("does not recognise a word that is not in the list", () => {
    // Arrange
    const dictionary = createDictionary(["cold", "cord"]);

    // Act
    const result = dictionary.has("card");

    // Assert
    expect(result).toBe(false);
  });

  it("recognises a word whatever case it is looked up in", () => {
    // Arrange
    const dictionary = createDictionary(["cold"]);

    // Act
    const result = dictionary.has("COLD");

    // Assert
    expect(result).toBe(true);
  });

  it("recognises a word whatever case it was listed in", () => {
    // Arrange
    const dictionary = createDictionary(["Cold"]);

    // Act
    const result = dictionary.has("cold");

    // Assert
    expect(result).toBe(true);
  });

  it("ignores entries that are not valid words", () => {
    // Arrange
    const dictionary = createDictionary(["cold", "c0ld", "co-d", "co d", ""]);

    // Act
    const result = dictionary.wordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold"]);
  });

  it("lists only words of the requested length", () => {
    // Arrange
    const dictionary = createDictionary(["cat", "cold", "cord", "colds"]);

    // Act
    const result = dictionary.wordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord"]);
  });

  it("lists each word once even when the list repeats it", () => {
    // Arrange
    const dictionary = createDictionary(["cold", "COLD", "cord", "cold"]);

    // Act
    const result = dictionary.wordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord"]);
  });

  it("lists words in alphabetical order whatever order they were given in", () => {
    // Arrange
    const dictionary = createDictionary(["warm", "cord", "cold"]);

    // Act
    const result = dictionary.wordsOfLength(4);

    // Assert
    expect(result).toEqual(["cold", "cord", "warm"]);
  });
});
