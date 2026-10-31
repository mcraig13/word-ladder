import { describe, expect, it } from "vitest";
import { applyMove } from "../../src/core/applyMove";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import type { Game } from "../../src/core/createGame";

// Chunk 1.6. Rules: a rejected attempt is not a move and gives a reason
// (D13), the game is won when the chain reaches the target, and no moves are
// accepted after that (CLAUDE.md, Ending). The game passed in never changes.

const dictionary = createDictionaryFromWords(["cold", "cord", "card", "ward", "warm", "worm"]);

describe("applyMove", () => {
  it("applying a valid move extends the chain", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

    // Act
    const result = applyMove(game, "cord", dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { chain: ["cold", "cord"] } });
  });

  it("applying a move leaves the game it was given as it was", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

    // Act
    applyMove(game, "cord", dictionary);

    // Assert
    expect(game).toEqual({ start: "cold", target: "warm", chain: ["cold"], status: "in-progress" });
  });

  it("an invalid move returns the reason from checkMove", () => {
    // Arrange
    // "card" changes two letters of "cold".
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

    // Act
    const result = applyMove(game, "card", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-one-change" });
  });

  it("an invalid move checks repeats against the whole chain", () => {
    // Arrange
    // "cord" is one letter from the current word "card", but was played earlier.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card"],
      status: "in-progress",
    };

    // Act
    const result = applyMove(game, "cord", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "repeated-word" });
  });

  it("an invalid move leaves the chain unchanged", () => {
    // Arrange
    // "word" is one letter from "cord", but not in the dictionary.
    const game: Game = { start: "cold", target: "warm", chain: ["cold", "cord"], status: "in-progress" };

    // Act
    applyMove(game, "word", dictionary);

    // Assert
    expect(game.chain).toEqual(["cold", "cord"]);
  });

  it("the game is won when the chain reaches the target", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward"],
      status: "in-progress",
    };

    // Act
    const result = applyMove(game, "warm", dictionary);

    // Assert
    expect(result).toMatchObject({
      ok: true,
      game: { chain: ["cold", "cord", "card", "ward", "warm"], status: "won" },
    });
  });

  it("the game is won when the target is typed in a different case", () => {
    // Arrange
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward"],
      status: "in-progress",
    };

    // Act
    const result = applyMove(game, "WARM", dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { status: "won" } });
  });

  it("the game is still in progress before the target is reached", () => {
    // Arrange
    const game: Game = { start: "cold", target: "warm", chain: ["cold"], status: "in-progress" };

    // Act
    const result = applyMove(game, "cord", dictionary);

    // Assert
    expect(result).toMatchObject({ ok: true, game: { status: "in-progress" } });
  });

  it("no moves are accepted after the game is won", () => {
    // Arrange
    // "worm" is a legal move from "warm", so only the game being over rejects it.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
    };

    // Act
    const result = applyMove(game, "worm", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });

  it("reports game-over before any other reason", () => {
    // Arrange
    // "cards" is also the wrong length.
    const game: Game = {
      start: "cold",
      target: "warm",
      chain: ["cold", "cord", "card", "ward", "warm"],
      status: "won",
    };

    // Act
    const result = applyMove(game, "cards", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "game-over" });
  });
});
