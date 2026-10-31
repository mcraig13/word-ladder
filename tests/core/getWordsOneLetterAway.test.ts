import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { getWordsOneLetterAway } from "../../src/core/getWordsOneLetterAway";

// Chunk 1.4. Rules: a move changes exactly one letter, and every word in a
// chain must be an accepted word (CLAUDE.md). The same date must always give
// the same puzzle, so results come back in a stable order (D6).

describe("getWordsOneLetterAway", () => {
  it("returns every dictionary word one letter away", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "bold", "cola", "cord", "warm"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual(["bold", "cola", "cord"]);
  });

  it("does not include the word itself", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual(["cord"]);
  });

  it("only returns words that are in the dictionary", () => {
    // Arrange
    // "bold" and "colt" are real words one letter from "cold", but not listed.
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual(["cord"]);
  });

  it("ignores words that are a letter longer or shorter", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "colds", "old"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual([]);
  });

  it("returns nothing for a word with no words one letter away", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "warm"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual([]);
  });

  it("returns words in alphabetical order whatever order they were listed in", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cord", "cold", "cola", "bold"]);

    // Act
    const result = getWordsOneLetterAway("cold", dictionary);

    // Assert
    expect(result).toEqual(["bold", "cola", "cord"]);
  });

  it("ignores the case of the word it is given", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = getWordsOneLetterAway("COLD", dictionary);

    // Assert
    expect(result).toEqual(["cord"]);
  });
});
