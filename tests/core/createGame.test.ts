import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { createGame } from "../../src/core/createGame";

// Chunk 1.6. Rules: the chain begins with the start word, start and target
// are the same length (D4), and words are stored lowercase (CLAUDE.md). A new
// game has used no undos (D26, chunk 1.13). Start and target are accepted
// words with a path between them (D8), and par comes from a shortest path
// (D27, chunk 1.10).

const dictionary = createDictionaryFromWords(["cold", "cord", "card", "ward", "warm"]);

describe("createGame", () => {
  it("a new game's chain contains only the start word", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"] } });
  });

  it("a new game is in progress", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { status: "in-progress" } });
  });

  it("a new game has used no undos", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { undoCount: 0 } });
  });

  it("stores the start and target in lowercase without surrounding spaces", () => {
    // Arrange
    const start = " COLD ";
    const target = "Warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      game: { start: "cold", target: "warm", chain: ["cold"] },
    });
  });

  it("rejects creating a game where start and target differ in length", () => {
    // Arrange
    const start = "cold";
    const target = "warms";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "different-lengths" });
  });

  it("rejects creating a game with a start that is not a word", () => {
    // Arrange
    const start = "co1d";
    const target = "warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word" });
  });

  it("rejects creating a game with a target that is not a word", () => {
    // Arrange
    const start = "cold";
    const target = "";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word" });
  });

  it("rejects creating a game where start and target are the same word", () => {
    // Arrange
    // Same word in a different case is still the same word.
    const start = "cold";
    const target = "COLD";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "same-word" });
  });

  it("a new game's par comes from a shortest path between start and target", () => {
    // Arrange
    // Via "cord" is 4 moves, so par is 6. Via "bold" is 6 moves, which would give 9.
    const dictionaryWithLongerRoute = createDictionaryFromWords([
      ...["cold", "cord", "card", "ward", "warm"],
      ...["bold", "bald", "bard"],
    ]);

    // Act
    const result = createGame("cold", "warm", dictionaryWithLongerRoute);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { par: 6 } });
  });

  it("rejects creating a game with a start that is not an accepted word", () => {
    // Arrange
    const start = "colt";
    const target = "warm";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("rejects creating a game with a target that is not an accepted word", () => {
    // Arrange
    const start = "cold";
    const target = "wart";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("rejects creating a game whose target can't be reached", () => {
    // Arrange
    // Without "card", nothing links "cord" to "ward".
    const dictionaryWithGap = createDictionaryFromWords(["cold", "cord", "ward", "warm"]);

    // Act
    const result = createGame("cold", "warm", dictionaryWithGap);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("reports same-word before checking the dictionary", () => {
    // Arrange
    // "colt" is not an accepted word either; the same word is reported first.
    const start = "colt";
    const target = "COLT";

    // Act
    const result = createGame(start, target, dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "same-word" });
  });
});
