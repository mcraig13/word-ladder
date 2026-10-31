import { describe, expect, it } from "vitest";
import { areWordsOneLetterApart } from "../../src/core/areWordsOneLetterApart";

// Chunk 1.3. Rule: each move changes exactly one letter, in the same position.
// No adding, removing or reordering letters. Comparisons ignore case (CLAUDE.md).

describe("areWordsOneLetterApart", () => {
  it("accepts words that differ in exactly one position", () => {
    // Arrange
    const firstWord = "cold";
    const secondWord = "cord";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(true);
  });

  it("rejects identical words", () => {
    // Arrange
    const firstWord = "cold";
    const secondWord = "cold";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("rejects words that differ in two positions", () => {
    // Arrange
    const firstWord = "cold";
    const secondWord = "card";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("rejects the same letters in a different order", () => {
    // Arrange
    const firstWord = "cold";
    const secondWord = "clod";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("rejects adding a letter", () => {
    // Arrange
    const firstWord = "cold";
    const secondWord = "colds";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("rejects removing a letter", () => {
    // Arrange
    const firstWord = "colds";
    const secondWord = "cold";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("ignores case when comparing letters", () => {
    // Arrange
    const firstWord = "Cold";
    const secondWord = "cORD";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(true);
  });

  it("treats words that differ only in case as the same word", () => {
    // Arrange
    const firstWord = "COLD";
    const secondWord = "cold";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });

  it("rejects two empty words", () => {
    // Arrange
    const firstWord = "";
    const secondWord = "";

    // Act
    const result = areWordsOneLetterApart(firstWord, secondWord);

    // Assert
    expect(result).toBe(false);
  });
});
