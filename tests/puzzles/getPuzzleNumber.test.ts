import { describe, expect, it } from "vitest";
import { getPuzzleNumber } from "../../src/puzzles/getPuzzleNumber";

// Chunk 2.5. Rule: puzzle #1 is the launch date, and the number goes up by one
// each day (D15). Expected numbers are counted on a calendar: the launch date
// is #1, so a date n days later is #(n + 1).

describe("getPuzzleNumber", () => {
  it("the launch date is puzzle #1", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 15 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 1 });
  });

  it("the day after launch is puzzle #2", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 1, day: 16 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 2 });
  });

  it("counts across a month boundary", () => {
    // Arrange
    // 15 January is #1, 31 January is #17, 1 February is #18.
    const launchDate = { year: 2027, month: 1, day: 15 };
    const date = { year: 2027, month: 2, day: 1 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 18 });
  });

  it("counts across a year boundary", () => {
    // Arrange
    // 30 December is #1, 31 December #2, 1 January #3, 2 January #4.
    const launchDate = { year: 2026, month: 12, day: 30 };
    const date = { year: 2027, month: 1, day: 2 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 4 });
  });

  it("counts February 29 in a leap year", () => {
    // Arrange
    // 2028 is a leap year: 28 February #1, 29 February #2, 1 March #3.
    const launchDate = { year: 2028, month: 2, day: 28 };
    const date = { year: 2028, month: 3, day: 1 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 3 });
  });

  it("goes straight from February 28 to March 1 in a year that isn't a leap year", () => {
    // Arrange
    // 2027 isn't a leap year: 28 February #1, 1 March #2.
    const launchDate = { year: 2027, month: 2, day: 28 };
    const date = { year: 2027, month: 3, day: 1 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: true, puzzleNumber: 2 });
  });

  it("the day before launch has no puzzle number", () => {
    // Arrange
    // In the year before, so comparing only the month and day would miss it.
    const launchDate = { year: 2027, month: 1, day: 1 };
    const date = { year: 2026, month: 12, day: 31 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "before-launch" });
  });

  it("rejects February 29 in a year that isn't a leap year", () => {
    // Arrange
    // Counted as 1 March, it would quietly be puzzle #60.
    const launchDate = { year: 2027, month: 1, day: 1 };
    const date = { year: 2027, month: 2, day: 29 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("rejects month 13", () => {
    // Arrange
    // Counted as 1 January 2028, it would quietly be puzzle #366.
    const launchDate = { year: 2027, month: 1, day: 1 };
    const date = { year: 2027, month: 13, day: 1 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("rejects a day that isn't a whole number", () => {
    // Arrange
    const launchDate = { year: 2027, month: 1, day: 1 };
    const date = { year: 2027, month: 1, day: 2.5 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("rejects an invalid launch date", () => {
    // Arrange
    // Counted as 1 March, the launch would be the same day as the date: #1.
    const launchDate = { year: 2027, month: 2, day: 29 };
    const date = { year: 2027, month: 3, day: 1 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });

  it("reports an invalid date before launch as invalid, not before launch", () => {
    // Arrange
    // 2026 isn't a leap year, and the date is before launch either way.
    const launchDate = { year: 2027, month: 1, day: 1 };
    const date = { year: 2026, month: 2, day: 29 };

    // Act
    const result = getPuzzleNumber(date, launchDate);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-date" });
  });
});
