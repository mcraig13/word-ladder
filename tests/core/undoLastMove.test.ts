import { describe, expect, it } from "vitest";
import { applyMove } from "../../src/core/applyMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import type { Game } from "../../src/core/createGame";
import { undoLastMove } from "../../src/core/undoLastMove";

// Chunk 1.7. Rules: undo removes the last word at no cost, cannot go past the
// start word, and an undone word can be played again (D12). Undo is not
// available once the game has ended (backlog 1.7). The game passed in never
// changes.

const dictionary = createDictionaryFromWords(["cold", "cord", "card", "ward", "warm"]);

describe("undoLastMove", () => {
  it("removes the last word from the chain", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({
      ok: true,
      game: { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" },
    });
  });

  it("can undo the first move back to the start word", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"] } });
  });

  it("undoing leaves the game it was given as it was", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" };

    // Act
    undoLastMove(game);

    // Assert
    expect(game).toEqual({ start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" });
  });

  it("cannot undo past the start word", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

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
    };

    // Act
    const result = undoLastMove(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });
});
