import { describe, expect, it } from "vitest";
import { applyMove } from "../../src/core/applyMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { createGame, type Game } from "../../src/core/createGame";
import { getScore } from "../../src/core/getScore";

// Chunk 1.10. Rules: score is moves in the final chain, plus undos, minus the
// game's par (D26, D27), so it can be below par. A game that was given up has
// no score (D11), and nor does one still in progress. cold → warm has a
// shortest path of 4 moves, so par is 6.

describe("getScore", () => {
  it("a win in par moves scores 0", () => {
    // Arrange
    // 6 moves: cold → bold → bald → bard → card → ward → warm.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "bold", "bald", "bard", "card", "ward", "warm"],
      status: "won",
      undoCount: 0,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: true, score: 0 });
  });

  it("a win in two moves over par scores +2", () => {
    // Arrange
    // 8 moves: cold → hold → bold → bald → bard → hard → card → ward → warm.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "hold", "bold", "bald", "bard", "hard", "card", "ward", "warm"],
      status: "won",
      undoCount: 0,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: true, score: 2 });
  });

  it("a win along a shortest path scores below par", () => {
    // Arrange
    // 4 moves on par 6.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
      undoCount: 0,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: true, score: -2 });
  });

  it("each undo adds one to the score", () => {
    // Arrange
    // 4 moves plus 3 undos on par 6.
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
      undoCount: 3,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: true, score: 1 });
  });

  it("a game is scored against the par it was created with", () => {
    // Arrange
    // cold → cord is a one-move puzzle, so par is 2. Won in 1 move.
    const dictionary = createDictionaryFromWords(["cold", "cord"]);
    const created = createGame("cold", "cord", dictionary);
    if (!created.ok) {
      throw new Error("Arrange failed: game was not created");
    }
    const won = applyMove(created.game, "cord", dictionary);
    if (!won.ok) {
      throw new Error("Arrange failed: move was rejected");
    }

    // Act
    const result = getScore(won.game);

    // Assert
    expect(result).toEqual({ ok: true, score: -1 });
  });

  it("a game that was given up has no score", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord", "card"],
      status: "given-up",
      undoCount: 0,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "given-up" });
  });

  it("a game in progress has no score", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      par: 6,
      chain: ["cold", "cord", "card"],
      status: "in-progress",
      undoCount: 0,
    };

    // Act
    const result = getScore(game);

    // Assert
    expect(result).toEqual({ ok: false, reason: "in-progress" });
  });
});
