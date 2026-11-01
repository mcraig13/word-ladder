import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import type { Schedule } from "../../src/puzzles/extendSchedule";
import { findGameForDate } from "../../src/puzzles/findGameForDate";

// Chunk 3.1. With a launch on 15 January 2027, 15 January is puzzle #1 (line 1)
// and 16 January is #2 (line 2) (D15, D24). Line 2 is cold → warm, whose
// shortest path over the accepted words is cold → cord → card → ward → warm:
// 4 moves, so par is 6 (D27). The puzzle words hold only the start and target
// words, so par worked out over them would find no path (D8, D31).
const launchDate = { year: 2027, month: 1, day: 15 };
const dayAfterLaunch = { year: 2027, month: 1, day: 16 };
const twoDaySchedule: Schedule = [
  { start: "lead", target: "gold", shortestPathMoves: 3 },
  { start: "cold", target: "warm", shortestPathMoves: 4 },
];
const gameData = {
  acceptedWords: createDictionaryFromWords(["cold", "cord", "card", "ward", "warm"]),
  puzzleWords: createDictionaryFromWords(["cold", "warm"]),
  schedule: twoDaySchedule,
};

describe("findGameForDate", () => {
  it("counts the launch date as puzzle #1, so the next day is #2", () => {
    // Arrange
    const date = dayAfterLaunch;

    // Act
    const result = findGameForDate(date, launchDate, gameData);

    // Assert
    expect(result.ok && result.puzzleNumber).toBe(2);
  });

  it("starts the game at the scheduled start word, aiming at its target", () => {
    // Arrange
    const date = dayAfterLaunch;

    // Act
    const result = findGameForDate(date, launchDate, gameData);

    // Assert
    expect(result.ok && [result.game.start, result.game.target]).toEqual(["cold", "warm"]);
  });

  it("works par out over the accepted words, not the puzzle words", () => {
    // Arrange
    const date = dayAfterLaunch;

    // Act
    const result = findGameForDate(date, launchDate, gameData);

    // Assert
    expect(result.ok && result.game.par).toBe(6);
  });

  it("reports after-schedule for a date past the last puzzle", () => {
    // Arrange
    const thirdDay = { year: 2027, month: 1, day: 17 };

    // Act
    const result = findGameForDate(thirdDay, launchDate, gameData);

    // Assert
    expect(result).toEqual({ ok: false, reason: "after-schedule" });
  });

  it("reports unreachable when the scheduled words aren't linked by accepted words", () => {
    // Arrange
    const gameDataWithoutLinks = {
      ...gameData,
      acceptedWords: createDictionaryFromWords(["cold", "warm"]),
    };

    // Act
    const result = findGameForDate(dayAfterLaunch, launchDate, gameDataWithoutLinks);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });
});
