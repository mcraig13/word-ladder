import { describe, expect, it } from "vitest";
import { createGame } from "../../src/core/createGame";

// Chunk 1.6. Rules: the chain begins with the start word, start and target
// are the same length (D4), and words are stored lowercase (CLAUDE.md). A new
// game has used no undos (D26, chunk 1.13).

describe("createGame", () => {
  it("a new game's chain contains only the start word", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"] } });
  });

  it("a new game is in progress", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { status: "in-progress" } });
  });

  it("a new game has used no undos", () => {
    // Arrange
    const start = "cold";
    const target = "warm";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { undoCount: 0 } });
  });

  it("stores the start and target in lowercase without surrounding spaces", () => {
    // Arrange
    const start = " COLD ";
    const target = "Warm";

    // Act
    const result = createGame(start, target);

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
    const result = createGame(start, target);

    // Assert
    expect(result).toEqual({ ok: false, reason: "different-lengths" });
  });

  it("rejects creating a game with a start that is not a word", () => {
    // Arrange
    const start = "co1d";
    const target = "warm";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word" });
  });

  it("rejects creating a game with a target that is not a word", () => {
    // Arrange
    const start = "cold";
    const target = "";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word" });
  });

  it("rejects creating a game where start and target are the same word", () => {
    // Arrange
    // Same word in a different case is still the same word.
    const start = "cold";
    const target = "COLD";

    // Act
    const result = createGame(start, target);

    // Assert
    expect(result).toEqual({ ok: false, reason: "same-word" });
  });
});
