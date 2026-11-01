import { describe, expect, it } from "vitest";
import type { Schedule } from "../../src/puzzles/extendSchedule";
import { findPuzzleForDate } from "../../src/puzzles/findPuzzleForDate";

// Chunk 2.4. Rule: everyone on a given date gets the same puzzle, the one on
// the schedule line for the date's puzzle number (D5, D24). Line N is puzzle
// #N, and the launch date is #1 (D15), so with a launch on 15 January 2027:
// 15 January is line 1, 16 January line 2, 17 January line 3.
// The moves are stored for 2.6b's check and aren't part of the result.
const threeDaySchedule: Schedule = [
  { start: "cold", target: "warm", shortestPathMoves: 4 },
  { start: "head", target: "tail", shortestPathMoves: 5 },
  { start: "lead", target: "gold", shortestPathMoves: 3 },
];

describe("findPuzzleForDate", () => {
  it("the launch date gets the first puzzle in the schedule", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 15 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({
      ok: true,
      puzzleNumber: 1,
      puzzle: { start: "cold", target: "warm" },
    });
  });

  it("the day after launch gets the puzzle on the second line", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 16 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({
      ok: true,
      puzzleNumber: 2,
      puzzle: { start: "head", target: "tail" },
    });
  });

  it("the last scheduled date gets the last puzzle in the schedule", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 17 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({
      ok: true,
      puzzleNumber: 3,
      puzzle: { start: "lead", target: "gold" },
    });
  });

  it("the day after the schedule ends has no puzzle", () => {
    // Arrange
    // 18 January would be puzzle #4, and the schedule has three lines.
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 18 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "after-schedule" });
  });

  it("an empty schedule has no puzzle on the launch date", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 15 };
    const emptySchedule: Schedule = [];

    // Act
    const result = findPuzzleForDate(date, launchDate, emptySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "after-schedule" });
  });

  it("a date before launch has no puzzle, with the reason from getPuzzleNumber", () => {
    // Arrange
    // 14 January would be puzzle #0; a lookup at line 0 or the last line
    // (array index −1) must not give it a puzzle.
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 14 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "before-launch" });
  });

  it("an invalid date has no puzzle, with the reason from getPuzzleNumber", () => {
    // Arrange
    // 2027 isn't a leap year, so 29 February would roll on to 1 March.
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 2, day: 29 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("a date before launch has no puzzle even when the schedule is empty", () => {
    // Arrange
    // Both checks fail; the date is checked first, so the reason is the date's.
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 14 };
    const emptySchedule: Schedule = [];

    // Act
    const result = findPuzzleForDate(date, launchDate, emptySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "before-launch" });
  });

  it("an invalid launch date has no puzzle, even on the launch date itself", () => {
    // Arrange
    // 2027 isn't a leap year, so 29 February isn't a date, as launch or as today.
    const launchDate = { year: 2027, month: 2, day: 29 };
    const date = { year: 2027, month: 2, day: 29 };

    // Act
    const result = findPuzzleForDate(date, launchDate, threeDaySchedule);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });
});
