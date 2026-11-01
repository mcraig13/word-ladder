import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { getExtendedScheduleText } from "../../src/puzzles/getExtendedScheduleText";

// Chunk 2.6b. Rules: the build extends the file rather than rebuilding it,
// so every line already in it stays exactly as it is (D24, 2.6a review B3),
// and the schedule reaches the requested number of puzzles after today's
// (D24, about a year ahead).
//
// LADDER is a line, cold 0, cord 1, card 2, ward 3, warm 4, so a range of
// exactly 4 moves allows only cold-warm, in either direction.

const LADDER = ["cold", "cord", "card", "ward", "warm"];

const ladderOptions = {
  acceptedWords: createDictionaryFromWords(LADDER),
  puzzleWords: createDictionaryFromWords(LADDER),
  wordLength: 4,
  shortestPathMoves: { fewest: 4, most: 4 },
  scheduleSeed: 2026,
  daysBeforeWordRepeats: 0,
  // 2.6c's check that the schedule doesn't run out, off except where a test sets it.
  fewestPuzzlesAhead: 0,
};

// Two lines generation wouldn't pick for a range of 4 moves.
const EXISTING_TEXT = "cord card 1\nward cord 2\n";

// Chunk 2.3. The file's lines are 1 and 2 moves, so after today's they pass
// the range check only with a range that takes them in. Tests that use it
// add no puzzles, so it doesn't change what generation picks.
const RANGE_FOR_EXISTING_LINES = { fewest: 1, most: 4 };

function getLines(text: string): string[] {
  return text.split("\n").filter((line) => line !== "");
}

describe("getExtendedScheduleText", () => {
  it("extending the schedule adds puzzles up to the requested number ahead of today's", () => {
    // Arrange
    // Today is #2, so 3 ahead is up to #5.
    const options = { ...ladderOptions, todaysPuzzleNumber: 2, puzzlesAhead: 3 };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    const text = result.ok ? result.scheduleText : "";
    expect(getLines(text)).toHaveLength(5);
  });

  it("keeps the file's existing lines exactly as they are", () => {
    // Arrange
    const options = { ...ladderOptions, todaysPuzzleNumber: 2, puzzlesAhead: 3 };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    const text = result.ok ? result.scheduleText : "";
    expect(text.slice(0, EXISTING_TEXT.length)).toBe("cord card 1\nward cord 2\n");
  });

  it("leaves a file that already reaches far enough ahead as it is", () => {
    // Arrange
    // Today is #0, so 1 ahead needs only #1; the file has two.
    const options = {
      ...ladderOptions,
      shortestPathMoves: RANGE_FOR_EXISTING_LINES,
      todaysPuzzleNumber: 0,
      puzzlesAhead: 1,
    };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: true, scheduleText: "cord card 1\nward cord 2\n" });
  });

  it("builds a schedule from an empty file", () => {
    // Arrange
    // Before launch today is #0, so 3 ahead is #1 to #3.
    const options = { ...ladderOptions, todaysPuzzleNumber: 0, puzzlesAhead: 3 };

    // Act
    const result = getExtendedScheduleText("", options);

    // Assert
    const text = result.ok ? result.scheduleText : "";
    const pairs = getLines(text).map((line) => line.split(" ").slice(0, 2).sort().join("-"));
    expect(pairs).toEqual(["cold-warm", "cold-warm", "cold-warm"]);
  });

  it("reports an unreadable line with its line number", () => {
    // Arrange
    const options = { ...ladderOptions, todaysPuzzleNumber: 2, puzzlesAhead: 3 };

    // Act
    const result = getExtendedScheduleText("cord card 1\nWard cord 2\n", options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("reports the puzzle number with no puzzle in range", () => {
    // Arrange
    // No two LADDER words are 5 moves apart; the file has #1 and #2.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 5, most: 5 },
      todaysPuzzleNumber: 2,
      puzzlesAhead: 3,
    };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-puzzle-in-range", puzzleNumber: 3 });
  });

  it("extending reports a line already in the file that fails the checks", () => {
    // Arrange
    // Chunk 2.6c. cord-card is 1 move, not 2, as if a list change made a shortcut.
    const options = { ...ladderOptions, todaysPuzzleNumber: 2, puzzlesAhead: 3 };

    // Act
    const result = getExtendedScheduleText("cord card 2\nward cord 2\n", options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-changed", puzzleNumber: 1 });
  });

  it("extending reports too few puzzles ahead", () => {
    // Arrange
    // Chunk 2.6c. The file's two puzzles already reach 1 ahead of #0, so
    // nothing is added, and 2 is fewer than 3.
    const options = {
      ...ladderOptions,
      shortestPathMoves: RANGE_FOR_EXISTING_LINES,
      todaysPuzzleNumber: 0,
      puzzlesAhead: 1,
      fewestPuzzlesAhead: 3,
    };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "too-few-puzzles-ahead", puzzlesAhead: 2 });
  });

  // Added after review (breaks finding 2): the checks run on the extended
  // schedule with the options the build was given.

  it("extending checks the new puzzles as well as the file's lines", () => {
    // Arrange
    // The empty file has none ahead; the three added reach exactly the fewest.
    const options = {
      ...ladderOptions,
      todaysPuzzleNumber: 0,
      puzzlesAhead: 3,
      fewestPuzzlesAhead: 3,
    };

    // Act
    const result = getExtendedScheduleText("", options);

    // Assert
    expect(result.ok).toBe(true);
  });

  it("extending checks the file's lines with the repeat window it is given", () => {
    // Arrange
    // card is #1's target and #2's start, within a window of 2.
    const options = {
      ...ladderOptions,
      shortestPathMoves: RANGE_FOR_EXISTING_LINES,
      daysBeforeWordRepeats: 2,
      todaysPuzzleNumber: 0,
      puzzlesAhead: 1,
    };

    // Act
    const result = getExtendedScheduleText("cord card 1\ncard ward 1\n", options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "word-repeats-too-soon", puzzleNumber: 2 });
  });

  it("extending checks the file's lines against the puzzle words, not the accepted words", () => {
    // Arrange
    // cord is accepted but not a puzzle word.
    const options = {
      ...ladderOptions,
      puzzleWords: createDictionaryFromWords(["cold", "card", "ward", "warm"]),
      todaysPuzzleNumber: 0,
      puzzlesAhead: 1,
    };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-puzzle-word", puzzleNumber: 1 });
  });

  it("extending counts the puzzles ahead from today's puzzle number", () => {
    // Arrange
    // Today is #1 of the file's two, so one is ahead, fewer than 2.
    const options = {
      ...ladderOptions,
      shortestPathMoves: RANGE_FOR_EXISTING_LINES,
      todaysPuzzleNumber: 1,
      puzzlesAhead: 1,
      fewestPuzzlesAhead: 2,
    };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "too-few-puzzles-ahead", puzzlesAhead: 1 });
  });

  it("extending checks the file's lines against the shortest-path range it is given", () => {
    // Arrange
    // Chunk 2.3. #1, cord-card, is 1 move, outside the range of exactly 4.
    const options = { ...ladderOptions, todaysPuzzleNumber: 0, puzzlesAhead: 1 };

    // Act
    const result = getExtendedScheduleText(EXISTING_TEXT, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-out-of-range", puzzleNumber: 1 });
  });
});
