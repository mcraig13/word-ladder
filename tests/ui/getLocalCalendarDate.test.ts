import process from "node:process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getLocalCalendarDate } from "../../src/ui/getLocalCalendarDate";

// Chunk 3.1. "Today" is the player's local date (D6). Kiritimati is UTC+14,
// so 9 am on 1 November there is still 31 October in UTC: a version that
// reads the UTC date fails here, even on a machine set to UTC, such as CI.
const playerTimezone = "Pacific/Kiritimati";
let timezoneBefore: string | undefined;

beforeAll(() => {
  timezoneBefore = process.env.TZ;
  process.env.TZ = playerTimezone;
});

afterAll(() => {
  if (timezoneBefore === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = timezoneBefore;
  }
});

describe("getLocalCalendarDate", () => {
  it("uses the player's local date, not the UTC date", () => {
    // Arrange
    const nineAmFirstNovember = new Date(2026, 10, 1, 9, 0);

    // Act
    const date = getLocalCalendarDate(nineAmFirstNovember);

    // Assert
    expect(date).toEqual({ year: 2026, month: 11, day: 1 });
  });

  it("counts months from 1, so January is 1", () => {
    // Arrange
    const noonFifteenthJanuary = new Date(2027, 0, 15, 12, 0);

    // Act
    const date = getLocalCalendarDate(noonFifteenthJanuary);

    // Assert
    expect(date).toEqual({ year: 2027, month: 1, day: 15 });
  });

  it("a time just before midnight is still that day", () => {
    // Arrange
    const justBeforeMidnight = new Date(2026, 11, 31, 23, 59, 59, 999);

    // Act
    const date = getLocalCalendarDate(justBeforeMidnight);

    // Assert
    expect(date).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it("a time just after midnight is already the new day, and the new year", () => {
    // Arrange
    const justAfterMidnightNewYear = new Date(2027, 0, 1, 0, 0, 1);

    // Act
    const date = getLocalCalendarDate(justAfterMidnightNewYear);

    // Assert
    expect(date).toEqual({ year: 2027, month: 1, day: 1 });
  });
});
