import { describe, expect, it } from "vitest";
import { getScheduleText } from "../../src/puzzles/getScheduleText";

// Chunk 2.6a. The schedule file: line N is puzzle #N, as start, target and
// the shortest path's moves, one space apart, with a newline after each line
// (2.6a intent, file format).

describe("getScheduleText", () => {
  it("writes one line per puzzle, in order, as start, target and moves", () => {
    // Arrange
    const schedule = [
      { start: "cold", target: "warm", shortestPathMoves: 4 },
      { start: "cord", target: "ward", shortestPathMoves: 2 },
    ];

    // Act
    const text = getScheduleText(schedule);

    // Assert
    expect(text).toBe("cold warm 4\ncord ward 2\n");
  });

  it("writes an empty file for an empty schedule", () => {
    // Arrange
    const schedule: never[] = [];

    // Act
    const text = getScheduleText(schedule);

    // Assert
    expect(text).toBe("");
  });
});
