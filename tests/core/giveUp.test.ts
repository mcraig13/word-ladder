import { describe, expect, it } from "vitest";
import { applyMove } from "../../src/core/applyMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import type { Game } from "../../src/core/createGame";
import { giveUp } from "../../src/core/giveUp";

// Chunk 1.8. Rules: giving up ends the game as a loss (D11), a game that has
// ended can't be given up, and no moves are accepted after giving up. The game
// passed in never changes.

const dictionary = createDictionaryFromWords(["cold", "cord", "card", "ward", "warm"]);

describe("giveUp", () => {
  it("giving up ends the game as a loss", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({
      ok: true,
      game: { start: "cold", target: "warm", chain: ["cold", "cord", "card"], status: "given-up" },
    });
  });

  it("can give up at the start word before any move", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"], status: "given-up" } });
  });

  it("giving up leaves the game it was given as it was", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" };

    // Act
    giveUp(game);

    // Assert
    expect(game).toEqual({ start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" });
  });

  it("no moves are accepted after giving up", () => {
    // Arrange
    // "card" would be a valid next move if the game were still in progress.
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" };
    const givenUp = giveUp(game);
    if (!givenUp.ok) {
      throw new Error("Arrange failed: giving up was rejected");
    }

    // Act
    const result = applyMove(givenUp.game, "card", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("cannot give up a game that is already won", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("cannot give up a game that has already been given up", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "given-up" };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });
});
