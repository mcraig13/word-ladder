import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { checkSchedule } from "../../src/puzzles/checkSchedule";
import type { ScheduledPuzzle } from "../../src/puzzles/extendSchedule";

// Chunk 2.6c. Rules: start and target are different puzzle words (D8, 2.6b
// review G3); every puzzle is solvable with the accepted words and its
// shortest path still has the moves stored for it, so par can't shift
// unnoticed (D24, D27); no start or target comes back within the repeat
// window (D30); at least the fewest allowed puzzles remain after today's
// (D24, 60 in the build). Chunk 2.3: every puzzle after today's has a
// shortest path within the range (D16, 4-6 in the build); published ones
// keep the range they were made with (D24).
//
// LADDER is a line: each word is one move from the next and no others, so the
// moves between two words are how far apart they are in the list.
// cold 0, cord 1, card 2, ward 3, warm 4 (the CLAUDE.md example).

const LADDER = ["cold", "cord", "card", "ward", "warm"];

// Every check but the one a test is about passes: no repeat window, no
// puzzles needed after today's, and a range that takes in every pair.
const ladderOptions = {
  acceptedWords: createDictionaryFromWords(LADDER),
  puzzleWords: createDictionaryFromWords(LADDER),
  shortestPathMoves: { fewest: 1, most: 4 },
  daysBeforeWordRepeats: 0,
  todaysPuzzleNumber: 0,
  fewestPuzzlesAhead: 0,
};

function createScheduledPuzzle(
  start: string,
  target: string,
  shortestPathMoves: number,
): ScheduledPuzzle {
  return { start, target, shortestPathMoves };
}

// Three puzzles with no word repeated within one puzzle of it.
const THREE_PUZZLES = [
  createScheduledPuzzle("cold", "warm", 4),
  createScheduledPuzzle("cord", "card", 1),
  createScheduledPuzzle("warm", "ward", 1),
];

describe("checkSchedule", () => {
  it("passes a schedule that meets every check", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      daysBeforeWordRepeats: 1,
      todaysPuzzleNumber: 0,
      fewestPuzzlesAhead: 3,
    };

    // Act
    const result = checkSchedule(THREE_PUZZLES, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("rejects a start that isn't a puzzle word, naming the puzzle", () => {
    // Arrange
    // cold is accepted but not a puzzle word.
    const options = {
      ...ladderOptions,
      puzzleWords: createDictionaryFromWords(["cord", "card", "ward", "warm"]),
    };
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "warm", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-puzzle-word", puzzleNumber: 2 });
  });

  it("rejects a target that isn't a puzzle word, naming the puzzle", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      puzzleWords: createDictionaryFromWords(["cord", "card", "ward", "warm"]),
    };
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("warm", "cold", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-puzzle-word", puzzleNumber: 2 });
  });

  it("rejects a puzzle whose start and target are the same word", () => {
    // Arrange
    // Its shortest path is 0 moves, not 1, but the same word is the clearer reason.
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "cold", 1),
    ];

    // Act
    const result = checkSchedule(schedule, ladderOptions);

    // Assert
    expect(result).toEqual({ ok: false, reason: "same-start-and-target", puzzleNumber: 2 });
  });

  it("rejects a puzzle with no path over the accepted words", () => {
    // Arrange
    // tent and test are one move apart, but no move joins them to LADDER.
    const words = [...LADDER, "tent", "test"];
    const options = {
      ...ladderOptions,
      acceptedWords: createDictionaryFromWords(words),
      puzzleWords: createDictionaryFromWords(words),
    };
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "test", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unsolvable", puzzleNumber: 2 });
  });

  it("searches for the shortest path over the accepted words, not the puzzle words", () => {
    // Arrange
    // Added after review (finding 1). cord, card and ward are accepted but
    // not puzzle words, and cold-warm needs all three (D8).
    const options = { ...ladderOptions, puzzleWords: createDictionaryFromWords(["cold", "warm"]) };
    const schedule = [createScheduledPuzzle("cold", "warm", 4)];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("rejects a puzzle whose shortest path has fewer moves than stored", () => {
    // Arrange
    // As if a word added to the accepted list made a shortcut: cold-warm is 4.
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "warm", 5),
    ];

    // Act
    const result = checkSchedule(schedule, ladderOptions);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-changed", puzzleNumber: 2 });
  });

  it("rejects a puzzle whose shortest path has more moves than stored", () => {
    // Arrange
    // As if a word removed from the accepted list cut a shortcut: cold-warm is 4.
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "warm", 3),
    ];

    // Act
    const result = checkSchedule(schedule, ladderOptions);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-changed", puzzleNumber: 2 });
  });

  it("rejects a start that was a target within the repeat window", () => {
    // Arrange
    // warm was #1's target, two puzzles before #3, at the edge of a window of 2.
    const options = { ...ladderOptions, daysBeforeWordRepeats: 2 };
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("cord", "card", 1),
      createScheduledPuzzle("warm", "ward", 1),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "word-repeats-too-soon", puzzleNumber: 3 });
  });

  it("rejects a target that was a start within the repeat window", () => {
    // Arrange
    // cold was #1's start, two puzzles before #3, at the edge of a window of 2.
    const options = { ...ladderOptions, daysBeforeWordRepeats: 2 };
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("cord", "card", 1),
      createScheduledPuzzle("ward", "cold", 3),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "word-repeats-too-soon", puzzleNumber: 3 });
  });

  it("rejects a word repeated within the window near the start of the schedule", () => {
    // Arrange
    // Added after review (breaks finding 1). warm was #1's target, one puzzle
    // before #2, with fewer puzzles before it than the window of 2.
    const options = { ...ladderOptions, daysBeforeWordRepeats: 2 };
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("warm", "cord", 3),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "word-repeats-too-soon", puzzleNumber: 2 });
  });

  it("allows a word again once the repeat window has passed", () => {
    // Arrange
    // warm was #1's target, two puzzles before #3, outside a window of 1.
    const options = { ...ladderOptions, daysBeforeWordRepeats: 1 };

    // Act
    const result = checkSchedule(THREE_PUZZLES, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("allows any repeat when the repeat window is 0", () => {
    // Arrange
    // D30: a window of 0 turns the rule off.
    const options = { ...ladderOptions, daysBeforeWordRepeats: 0 };
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("cold", "warm", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("reports the first puzzle that fails", () => {
    // Arrange
    // cord-card is 1 move and card-cord is 1, so #2 and #3 both fail.
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("cord", "card", 2),
      createScheduledPuzzle("card", "cord", 3),
    ];

    // Act
    const result = checkSchedule(schedule, ladderOptions);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-changed", puzzleNumber: 2 });
  });

  it("rejects a schedule with fewer puzzles after today's than the fewest allowed", () => {
    // Arrange
    // Today is #1 of three, so two remain after it.
    const options = { ...ladderOptions, todaysPuzzleNumber: 1, fewestPuzzlesAhead: 3 };

    // Act
    const result = checkSchedule(THREE_PUZZLES, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "too-few-puzzles-ahead", puzzlesAhead: 2 });
  });

  it("passes a schedule with exactly the fewest puzzles allowed after today's", () => {
    // Arrange
    const options = { ...ladderOptions, todaysPuzzleNumber: 1, fewestPuzzlesAhead: 2 };

    // Act
    const result = checkSchedule(THREE_PUZZLES, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("rejects a today's puzzle number that isn't a number as too few puzzles ahead", () => {
    // Arrange
    // 3.8 works today's number out from the date; NaN must not slip through.
    const options = { ...ladderOptions, todaysPuzzleNumber: Number.NaN, fewestPuzzlesAhead: 3 };

    // Act
    const result = checkSchedule(THREE_PUZZLES, options);

    // Assert
    expect(result).toEqual({
      ok: false,
      reason: "too-few-puzzles-ahead",
      puzzlesAhead: Number.NaN,
    });
  });

  // Chunk 2.3.

  it("rejects a puzzle after today's whose shortest path is shorter than the range allows", () => {
    // Arrange
    // cord-card is 1 move, fewer than 2.
    const options = { ...ladderOptions, shortestPathMoves: { fewest: 2, most: 4 } };
    const schedule = [
      createScheduledPuzzle("cold", "warm", 4),
      createScheduledPuzzle("cord", "card", 1),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-out-of-range", puzzleNumber: 2 });
  });

  it("rejects a puzzle after today's whose shortest path is longer than the range allows", () => {
    // Arrange
    // cold-warm is 4 moves, more than 3.
    const options = { ...ladderOptions, shortestPathMoves: { fewest: 1, most: 3 } };
    const schedule = [
      createScheduledPuzzle("cord", "card", 1),
      createScheduledPuzzle("cold", "warm", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-out-of-range", puzzleNumber: 2 });
  });

  it("passes puzzles at exactly the fewest and the most moves the range allows", () => {
    // Arrange
    // cord-ward is 2 moves and cold-ward 3, the ends of a range of 2-3.
    const options = { ...ladderOptions, shortestPathMoves: { fewest: 2, most: 3 } };
    const schedule = [
      createScheduledPuzzle("cord", "ward", 2),
      createScheduledPuzzle("cold", "ward", 3),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("leaves today's and earlier puzzles out of the range check", () => {
    // Arrange
    // Today is #2. #1 and #2 are 1 and 2 moves, outside a range of exactly
    // 4, but published; #3 is 4 moves.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 4, most: 4 },
      todaysPuzzleNumber: 2,
    };
    const schedule = [
      createScheduledPuzzle("cord", "card", 1),
      createScheduledPuzzle("ward", "cord", 2),
      createScheduledPuzzle("cold", "warm", 4),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: true });
  });

  it("range-checks the first puzzle after today's", () => {
    // Arrange
    // Today is #1, so #2, 2 moves, is the first one checked against a range of 4.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 4, most: 4 },
      todaysPuzzleNumber: 1,
    };
    const schedule = [
      createScheduledPuzzle("cord", "card", 1),
      createScheduledPuzzle("ward", "cord", 2),
    ];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-out-of-range", puzzleNumber: 2 });
  });

  it("reports a changed shortest path as changed, not out of range", () => {
    // Arrange
    // 5 stored moves are outside a range of 4, but cold-warm is now 4 moves,
    // so the stored number is what's wrong.
    const options = { ...ladderOptions, shortestPathMoves: { fewest: 4, most: 4 } };
    const schedule = [createScheduledPuzzle("cold", "warm", 5)];

    // Act
    const result = checkSchedule(schedule, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "shortest-path-changed", puzzleNumber: 1 });
  });
});
