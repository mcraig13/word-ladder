import { describe, expect, it } from "vitest";
import { normaliseWord } from "../../src/core/normaliseWord";

// Chunk 1.1. Rules: words are stored and compared in lowercase (CLAUDE.md),
// and a word may only contain the letters a–z (D17 cleaning rules).

describe("normaliseWord", () => {
  it("lowercases a word", () => {
    // Arrange
    const input = "CoLD";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: true, word: "cold" });
  });

  it("trims surrounding spaces, tabs and newlines", () => {
    // Arrange
    const input = "\t cold \n";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: true, word: "cold" });
  });

  it("rejects an empty string", () => {
    // Arrange
    const input = "";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a string that is only whitespace", () => {
    // Arrange
    const input = "   ";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a word containing a digit", () => {
    // Arrange
    const input = "c0ld";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-letters" });
  });

  it("rejects a word containing an apostrophe", () => {
    // Arrange
    const input = "can't";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-letters" });
  });

  it("rejects a word containing a hyphen", () => {
    // Arrange
    const input = "co-ed";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-letters" });
  });

  it("rejects a space between letters", () => {
    // Arrange
    const input = "co ld";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-letters" });
  });

  it("rejects an accented letter", () => {
    // Arrange
    const input = "café";

    // Act
    const result = normaliseWord(input);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-letters" });
  });
});
