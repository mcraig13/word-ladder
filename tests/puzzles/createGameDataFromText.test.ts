import { describe, expect, it } from "vitest";
import { createGameDataFromText } from "../../src/puzzles/createGameDataFromText";

// Chunk 1.11. The accepted and puzzle texts differ ("cord" is only accepted),
// so a test fails if one is used in place of the other (D31).
const acceptedWordsText = "cold\ncord\nwarm\n";
const puzzleWordsText = "cold\nwarm\n";
const scheduleText = "cold warm 4\nwarm cold 4\n";

describe("createGameDataFromText", () => {
  it("the accepted words include a word that is not a puzzle word", () => {
    // Arrange
    const texts = { acceptedWordsText, puzzleWordsText, scheduleText };

    // Act
    const result = createGameDataFromText(texts);

    // Assert
    expect(result.ok && result.gameData.acceptedWords.containsWord("cord")).toBe(true);
  });

  it("the puzzle words leave out a word that is only an accepted word", () => {
    // Arrange
    const texts = { acceptedWordsText, puzzleWordsText, scheduleText };

    // Act
    const result = createGameDataFromText(texts);

    // Assert
    expect(result.ok && result.gameData.puzzleWords.getWordsOfLength(4)).toEqual(["cold", "warm"]);
  });

  it("reads the last word in a list, before the final newline", () => {
    // Arrange
    const texts = { acceptedWordsText: "cold\nwarm\n", puzzleWordsText, scheduleText };

    // Act
    const result = createGameDataFromText(texts);

    // Assert
    expect(result.ok && result.gameData.acceptedWords.containsWord("warm")).toBe(true);
  });

  it("reads the schedule text as the schedule, line N as puzzle #N", () => {
    // Arrange
    const texts = {
      acceptedWordsText,
      puzzleWordsText,
      scheduleText: "cold warm 4\nwarm cord 2\n",
    };

    // Act
    const result = createGameDataFromText(texts);

    // Assert
    expect(result.ok && result.gameData.schedule).toEqual([
      { start: "cold", target: "warm", shortestPathMoves: 4 },
      { start: "warm", target: "cord", shortestPathMoves: 2 },
    ]);
  });

  it("an unreadable schedule line gives no game data, with its line number", () => {
    // Arrange
    const texts = {
      acceptedWordsText,
      puzzleWordsText,
      scheduleText: "cold warm 4\nWarm cold 4\n",
    };

    // Act
    const result = createGameDataFromText(texts);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-schedule-line", lineNumber: 2 });
  });
});
