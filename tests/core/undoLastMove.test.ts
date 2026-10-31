import { describe, expect, it } from "vitest";
import { applyMove } from "../../src/core/applyMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import type { Game } from "../../src/core/createGame";
import { undoLastMove } from "../../src/core/undoLastMove";

// Chunk 1.7. Rules: undo removes the last word, cannot go past the start word,
// and an undone word can be played again (D12, kept by D26). Each undo adds one
// to the undo count (D26, chunk 1.13). Undo is not available once the game has
// ended (backlog 1.7). The game passed in never changes.

const dictionary = createDictionaryFromWords(["cold", "cord", "card", "ward", "warm"]);

describe("undoLastMove", () => {
  it("removes the last word from the chain", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({
      ok: true,
      game: {
        start: "cold",
        target: "warm",
        chain: ["cold", "cord"],
        status: "in-progress",
        undoCount: 1,
      },
    });
  });

  it("each undo adds one to the undo count", () => {
    // Arrange
    // Two undos already used, so the count must go up from 2, not be set to 1.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
      undoCount: 2,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { undoCount: 3 } });
  });

  it("can undo the first move back to the start word", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"] } });
  });

  it("undoing leaves the game it was given as it was", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    undoLastMove(game);

    // Assert
    expect(game).toEqual({
      start: "cold",
      target: "warm",
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    });
  });

  it("cannot undo past the start word", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "nothing-to-undo" });
  });

  it("an undone word can be played again", () => {
    // Arrange
    // "card" is undone, so it is no longer in the chain and is not a repeat.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
      undoCount: 0,
    };
    const undone = undoLastMove(game);
    if (!undone.ok) {
      throw new Error("Arrange failed: undo was rejected");
    }

    // Act
    const result = applyMove(undone.game, "card", dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold", "cord", "card"] } });
  });

  it("undo is not available after the game has been won", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("undo is not available after giving up", () => {
    // Arrange
    // The last word is not the target, so only the status says the game ended.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord"],
      status: "given-up",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("undo is not available after giving up at the start word", () => {
    // Arrange
    // Both reasons apply here; the game being over is reported first.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold"],
      status: "given-up",
      undoCount: 0,
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });
});
