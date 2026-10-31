import { describe, expect, it } from "vitest";
import { checkMove } from "../../src/core/checkMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";

// Chunk 1.5. Rules: a move changes exactly one letter in the same position,
// every word in a chain must be an accepted word, and a word already in the
// chain is rejected (CLAUDE.md, Moves; D13). A rejected attempt gives a
// reason. Reasons are checked in order: length → change → word → repeat.

describe("checkMove", () => {
  it("accepts a valid one-letter change to an accepted word", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "cord", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, word: "cord" });
  });

  it("returns the accepted word in lowercase without surrounding spaces", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, " CORD ", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, word: "cord" });
  });

  it("rejects a word of a different length with reason wrong-length", () => {
    // Arrange
    // "colds" is an accepted word, but adding a letter is not a move.
    const dictionary = createDictionaryFromWords(["cold", "colds"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "colds", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "wrong-length" });
  });

  it("rejects an empty word with reason wrong-length", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "wrong-length" });
  });

  it("rejects a change of more than one letter with reason not-one-change", () => {
    // Arrange
    // "card" is an accepted word, but changes two letters of "cold".
    const dictionary = createDictionaryFromWords(["cold", "card"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "card", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-one-change" });
  });

  it("rejects an unchanged word with reason not-one-change", () => {
    // Arrange
    // "cold" is also in the chain, so this also checks that change comes before repeat.
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "cold", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-one-change" });
  });

  it("rejects a word that moves letters around with reason not-one-change", () => {
    // Arrange
    // "load" has the letters of "cold" with one changed, but not in the same places.
    const dictionary = createDictionaryFromWords(["cold", "load"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "load", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-one-change" });
  });

  it("rejects a word not in the dictionary with reason not-a-word", () => {
    // Arrange
    // "colt" is one letter from "cold", but not an accepted word here.
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "colt", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("rejects a word containing non-letters with reason not-a-word", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "co1d", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("rejects a word used earlier in the chain with reason repeated-word", () => {
    // Arrange
    // "cord" is one letter from the current word "card", and accepted, but already used.
    const dictionary = createDictionaryFromWords(["cold", "cord", "card"]);
    const chain = ["cold", "cord", "card"];

    // Act
    const result = checkMove(chain, "cord", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "repeated-word" });
  });

  it("rejects the start word with reason repeated-word", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);
    const chain = ["cold", "cord"];

    // Act
    const result = checkMove(chain, "cold", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "repeated-word" });
  });

  it("ignores the case of the proposed word", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "CoRd", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, word: "cord" });
  });

  it("reports wrong-length before not-one-change and not-a-word", () => {
    // Arrange
    // "cards" is too long, changes more than one letter, and is not listed.
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "cards", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "wrong-length" });
  });

  it("reports not-one-change before not-a-word", () => {
    // Arrange
    // "warm" changes every letter of "cold", and is not listed.
    const dictionary = createDictionaryFromWords(["cold"]);
    const chain = ["cold"];

    // Act
    const result = checkMove(chain, "warm", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-one-change" });
  });
});
