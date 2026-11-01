import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import {
  extendSchedule,
  type ExtendScheduleResult,
  type ScheduledPuzzle,
} from "../../src/puzzles/extendSchedule";

// Chunk 2.6a. Rules: one puzzle per date, the same for the same seed (D5,
// D24); extending never changes a puzzle already in the schedule (D24); the
// shortest path is inside the requested range (D16, D27); a start or target
// word isn't one again within the repeat window (D30).
//
// LADDER is a line: each word is one move from the next and no others, so the
// moves between two words are how far apart they are in the list.
// cold 0, cord 1, card 2, ward 3, warm 4 (the CLAUDE.md example).

const LADDER = ["cold", "cord", "card", "ward", "warm"];

// Enough puzzles that every allowed pair turns up (each has about a 1 in 5
// chance per puzzle or better) and a wrong one would too.
const MANY_PUZZLES = 30;

// Enough schedule seeds that every allowed last puzzle turns up, for the same
// reason.
const SCHEDULE_SEEDS = [...Array.from({ length: 30 }).keys()];

// No repeat window: LADDER's five words can't fill one, except in the D30
// tests, which set their own.
const ladderOptions = {
  acceptedWords: createDictionaryFromWords(LADDER),
  puzzleWords: createDictionaryFromWords(LADDER),
  wordLength: 4,
  scheduleSeed: 2026,
  daysBeforeWordRepeats: 0,
};

// A puzzle as "first-second" in alphabetical order, so a puzzle and its
// reverse read the same.
function describePair(puzzle: ScheduledPuzzle): string {
  return [puzzle.start, puzzle.target].sort().join("-");
}

function describePairAndMoves(puzzle: ScheduledPuzzle): string {
  return `${describePair(puzzle)} ${String(puzzle.shortestPathMoves)}`;
}

function listDifferent(descriptions: readonly string[]): string[] {
  return [...new Set(descriptions)].sort();
}

// The schedule's last puzzle as a pair, or the reason there's no schedule.
function describeLastPuzzle(result: ExtendScheduleResult): string {
  if (!result.ok) {
    return result.reason;
  }
  const lastPuzzle = result.schedule.at(-1);
  return lastPuzzle === undefined ? "no puzzles" : describePair(lastPuzzle);
}

function areSharingAWord(firstPuzzle: ScheduledPuzzle, secondPuzzle: ScheduledPuzzle): boolean {
  const secondWords = [secondPuzzle.start, secondPuzzle.target];
  return secondWords.includes(firstPuzzle.start) || secondWords.includes(firstPuzzle.target);
}

// Two puzzles generation wouldn't pick for a range of 4 moves, which allows
// only cold-warm.
const EXISTING_SCHEDULE: ScheduledPuzzle[] = [
  { start: "cord", target: "card", shortestPathMoves: 1 },
  { start: "ward", target: "cord", shortestPathMoves: 2 },
];

describe("extendSchedule", () => {
  it("builds one puzzle for each number up to the last puzzle number", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      lastPuzzleNumber: 3,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(schedule).toHaveLength(3);
  });

  it("every scheduled puzzle's shortest path is within the requested range", () => {
    // Arrange
    // Two moves apart: cold-card, cord-ward, card-warm.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 2, most: 2 },
      lastPuzzleNumber: MANY_PUZZLES,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(listDifferent(schedule.map(describePair))).toEqual([
      "card-cold",
      "card-warm",
      "cord-ward",
    ]);
  });

  it("records each puzzle's shortest path moves", () => {
    // Arrange
    // Three moves: cold-ward, cord-warm. Four moves: cold-warm.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 3, most: 4 },
      lastPuzzleNumber: MANY_PUZZLES,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(listDifferent(schedule.map(describePairAndMoves))).toEqual([
      "cold-ward 3",
      "cold-warm 4",
      "cord-warm 3",
    ]);
  });

  it("measures each puzzle's shortest path over the accepted words, not the puzzle words", () => {
    // Arrange
    // cord and ward are accepted but not puzzle words, so cold-card goes
    // through cord and card-warm through ward: two moves each. Over the
    // puzzle words alone no two words are one move apart.
    const options = {
      ...ladderOptions,
      puzzleWords: createDictionaryFromWords(["cold", "card", "warm"]),
      shortestPathMoves: { fewest: 2, most: 2 },
      lastPuzzleNumber: MANY_PUZZLES,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(listDifferent(schedule.map(describePairAndMoves))).toEqual([
      "card-cold 2",
      "card-warm 2",
    ]);
  });

  it("builds puzzles of the requested word length", () => {
    // Arrange
    // cat 0, cot 1, dot 2, dog 3. Three moves in LADDER would give cold-ward
    // and cord-warm.
    const words = [...LADDER, "cat", "cot", "dot", "dog"];
    const options = {
      ...ladderOptions,
      acceptedWords: createDictionaryFromWords(words),
      puzzleWords: createDictionaryFromWords(words),
      wordLength: 3,
      shortestPathMoves: { fewest: 3, most: 3 },
      lastPuzzleNumber: 5,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(listDifferent(schedule.map(describePair))).toEqual(["cat-dog"]);
  });

  it("keeps every existing puzzle unchanged when extending", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 4, most: 4 },
      lastPuzzleNumber: 4,
    };

    // Act
    const result = extendSchedule(EXISTING_SCHEDULE, options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(schedule.slice(0, 2)).toEqual([
      { start: "cord", target: "card", shortestPathMoves: 1 },
      { start: "ward", target: "cord", shortestPathMoves: 2 },
    ]);
  });

  it("adds puzzles after the existing ones up to the last puzzle number", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 4, most: 4 },
      lastPuzzleNumber: 4,
    };

    // Act
    const result = extendSchedule(EXISTING_SCHEDULE, options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(schedule.slice(2).map(describePairAndMoves)).toEqual(["cold-warm 4", "cold-warm 4"]);
  });

  it("leaves a schedule that already reaches the last puzzle number as it is", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 4, most: 4 },
      lastPuzzleNumber: 1,
    };

    // Act
    const result = extendSchedule(EXISTING_SCHEDULE, options);

    // Assert
    expect(result).toEqual({
      ok: true,
      schedule: [
        { start: "cord", target: "card", shortestPathMoves: 1 },
        { start: "ward", target: "cord", shortestPathMoves: 2 },
      ],
    });
  });

  it("the same seed builds the same schedule", () => {
    // Arrange
    // Ten pairs, so twenty puzzles counting direction: thirty puzzles
    // matching by chance is far below 1 in 10³⁰.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      lastPuzzleNumber: MANY_PUZZLES,
    };
    const firstBuild = extendSchedule([], options);

    // Act
    const secondBuild = extendSchedule([], options);

    // Assert
    expect(secondBuild).toEqual(firstBuild);
  });

  it("extending gives the same puzzles as building the whole schedule at once", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      lastPuzzleNumber: MANY_PUZZLES,
    };
    const wholeBuild = extendSchedule([], options);
    const firstPart = extendSchedule([], { ...options, lastPuzzleNumber: 10 });
    const firstPartSchedule = firstPart.ok ? firstPart.schedule : [];

    // Act
    const extendedBuild = extendSchedule(firstPartSchedule, options);

    // Assert
    expect(extendedBuild).toEqual(wholeBuild);
  });

  it("gives different puzzle numbers different puzzles", () => {
    // Arrange
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      lastPuzzleNumber: MANY_PUZZLES,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    expect(listDifferent(schedule.map(describePair)).length).toBeGreaterThan(1);
  });

  it("never uses a start or target word again within the repeat window", () => {
    // Arrange
    // A window of one leaves three of LADDER's words for each next puzzle,
    // and any two of them are within four moves, so no date fails.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      daysBeforeWordRepeats: 1,
      lastPuzzleNumber: MANY_PUZZLES,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    const schedule = result.ok ? result.schedule : [];
    const puzzlesSharingAWordWithTheDayBefore = schedule
      .slice(1)
      .filter((puzzle, index) => areSharingAWord(puzzle, schedule[index] ?? puzzle));
    expect(schedule).toHaveLength(MANY_PUZZLES);
    expect(puzzlesSharingAWordWithTheDayBefore).toEqual([]);
  });

  it("counts the existing schedule's last puzzles in the repeat window", () => {
    // Arrange
    // The last two puzzles used cord, card and ward, which leaves cold-warm.
    // A window of one would leave card too.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      daysBeforeWordRepeats: 2,
      lastPuzzleNumber: 3,
    };

    // Act
    const lastPuzzles = SCHEDULE_SEEDS.map((scheduleSeed) =>
      describeLastPuzzle(extendSchedule(EXISTING_SCHEDULE, { ...options, scheduleSeed })),
    );

    // Assert
    expect(listDifferent(lastPuzzles)).toEqual(["cold-warm"]);
  });

  it("uses a word again once the repeat window has passed", () => {
    // Arrange
    // One move apart, with ward and warm held back by puzzle 2: cold-cord and
    // card-cord, reusing words from puzzle 1. A window of two would hold
    // back all but card, leaving no puzzle.
    const existingSchedule = [
      { start: "cold", target: "cord", shortestPathMoves: 1 },
      { start: "ward", target: "warm", shortestPathMoves: 1 },
    ];
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 1 },
      daysBeforeWordRepeats: 1,
      lastPuzzleNumber: 3,
    };

    // Act
    const lastPuzzles = SCHEDULE_SEEDS.map((scheduleSeed) =>
      describeLastPuzzle(extendSchedule(existingSchedule, { ...options, scheduleSeed })),
    );

    // Assert
    expect(listDifferent(lastPuzzles)).toEqual(["card-cord", "cold-cord"]);
  });

  it("reports the puzzle number that has no puzzle in range", () => {
    // Arrange
    // LADDER's farthest pair is four moves apart.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 5, most: 5 },
      lastPuzzleNumber: 4,
    };

    // Act
    const result = extendSchedule(EXISTING_SCHEDULE, options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-puzzle-in-range", puzzleNumber: 3 });
  });

  it("reports the puzzle number that has no puzzle partway through a run", () => {
    // Arrange
    // Puzzles 1 and 2 use four of LADDER's five words, and a window of two
    // holds them all back for puzzle 3, which leaves one word and no pair.
    const options = {
      ...ladderOptions,
      shortestPathMoves: { fewest: 1, most: 4 },
      daysBeforeWordRepeats: 2,
      lastPuzzleNumber: 5,
    };

    // Act
    const result = extendSchedule([], options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-puzzle-in-range", puzzleNumber: 3 });
  });
});
