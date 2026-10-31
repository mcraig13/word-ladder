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
    // Par 9, unlike the other tests, so a par set to 6 instead of kept goes red.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 9,
      chain: ["cold", "cord", "card"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({
      ok: true,
      game: {
        start: "cold",
        target: "warm",
        par: 9,
        chain: ["cold", "cord", "card"],
        status: "given-up",
        undoCount: 0,
      },
    });
  });

  it("can give up at the start word before any move", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold"], status: "given-up" } });
  });

  it("the undo count is kept when the game is given up", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 2,
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { status: "given-up", undoCount: 2 } });
  });

  it("giving up leaves the game it was given as it was", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    giveUp(game);

    // Assert
    expect(game).toEqual({
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    });
  });

  it("no moves are accepted after giving up", () => {
    // Arrange
    // "card" would be a valid next move if the game were still in progress.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord"],
      status: "in-progress",
      undoCount: 0,
    };
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
      par: 6,
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
      undoCount: 0,
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("cannot give up a game that has already been given up", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord"],
      status: "given-up",
      undoCount: 0,
    };

    // Act
    const result = giveUp(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });
});
