import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { generatePuzzle, type GeneratePuzzleResult } from "../../src/puzzles/generatePuzzle";

// Chunk 2.2. Rules: start and target are puzzle words, the shortest path over
// the accepted words is inside the requested range, and every puzzle is
// solvable (D8, D27). The same seed gives the same puzzle (D5, D24).
//
// LADDER is a line: each word is one move from the next and no others, so the
// moves between two words are how far apart they are in the list.
// cold 0, cord 1, card 2, ward 3, warm 4 (the CLAUDE.md example).

const LADDER = ["cold", "cord", "card", "ward", "warm"];

// Enough seeds that every allowed puzzle turns up (each has about a 1 in 10
// chance per seed or better) and a wrong one would too.
const SEEDS = [...Array.from({ length: 100 }).keys()];

// A puzzle as "first-second" in alphabetical order, so a puzzle and its
// reverse read the same; a failure as its reason.
function describePuzzle(result: GeneratePuzzleResult): string {
  return result.ok ? [result.puzzle.start, result.puzzle.target].sort().join("-") : result.reason;
}

function listDifferentPuzzles(descriptions: readonly string[]): string[] {
  return [...new Set(descriptions)].sort();
}

describe("generatePuzzle", () => {
  it("start and target are both puzzle words", () => {
    // Arrange
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(["cold", "warm"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 1, most: 4 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-warm"]);
  });

  it("never picks a puzzle word that isn't an accepted word", () => {
    // Arrange
    // "wold" is one move from "cold", so a search from it would find targets.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(["cold", "warm", "wold"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 1, most: 5 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-warm"]);
  });

  it("never picks a target closer than the fewest moves", () => {
    // Arrange
    // 3 moves: cold-ward, cord-warm. 4 moves: cold-warm. "card" is 2 or fewer
    // from every word, so it can't be in a puzzle.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(LADDER),
      wordLength: 4,
      shortestPathMoves: { fewest: 3, most: 4 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-ward", "cold-warm", "cord-warm"]);
  });

  it("never picks a target farther than the most moves", () => {
    // Arrange
    // 1 move: cold-cord, card-cord, card-ward, ward-warm.
    // 2 moves: card-cold, cord-ward, card-warm.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(LADDER),
      wordLength: 4,
      shortestPathMoves: { fewest: 1, most: 2 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual([
      "card-cold",
      "card-cord",
      "card-ward",
      "card-warm",
      "cold-cord",
      "cord-ward",
      "ward-warm",
    ]);
  });

  it("measures a target by its shortest path when a longer route also reaches it", () => {
    // Arrange
    // A loop: bold, bald and bard join cold to card and ward the long way.
    // Shortest paths: cold-ward 3; cold-card, cold-bald, card-bald and
    // ward-bald 2; card-ward 1. A longer route would put more pairs at 3 or 4.
    const options = {
      acceptedWords: createDictionaryFromWords([...LADDER, "bold", "bald", "bard"]),
      puzzleWords: createDictionaryFromWords(["cold", "card", "ward", "bald"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 3, most: 4 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-ward"]);
  });

  it("every generated puzzle is solvable", () => {
    // Arrange
    // "mint" and "mist" are a cloud of their own: nothing reaches LADDER.
    const options = {
      acceptedWords: createDictionaryFromWords([...LADDER, "mint", "mist"]),
      puzzleWords: createDictionaryFromWords(["cold", "warm", "mint"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 1, most: 10 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-warm"]);
  });

  it("never picks the start as its own target, even when the range starts at 0 moves", () => {
    // Arrange
    // createGame rejects a start equal to the target (1.10).
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(["cold", "warm"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 0, most: 4 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-warm"]);
  });

  it("tries another start when the first one picked has no target in range", () => {
    // Arrange
    // "card" is 2 moves from both other puzzle words, so it has no target.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(["cold", "card", "warm"]),
      wordLength: 4,
      shortestPathMoves: { fewest: 4, most: 4 },
    };

    // Act
    const puzzles = SEEDS.map((seed) => describePuzzle(generatePuzzle({ ...options, seed })));

    // Assert
    expect(listDifferentPuzzles(puzzles)).toEqual(["cold-warm"]);
  });

  it("the same seed produces the same puzzle", () => {
    // Arrange
    // Ten pairs, so twenty puzzles counting direction: twenty seeds matching
    // by chance is well under 1 in 10²⁰.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(LADDER),
      wordLength: 4,
      shortestPathMoves: { fewest: 1, most: 4 },
    };
    const someSeeds = SEEDS.slice(0, 20);
    const firstRun = someSeeds.map((seed) => generatePuzzle({ ...options, seed }));

    // Act
    const secondRun = someSeeds.map((seed) => generatePuzzle({ ...options, seed }));

    // Assert
    expect(secondRun).toEqual(firstRun);
  });

  it("picks words of the requested length", () => {
    // Arrange
    const options = {
      acceptedWords: createDictionaryFromWords([...LADDER, "beard", "board"]),
      puzzleWords: createDictionaryFromWords([...LADDER, "beard", "board"]),
      wordLength: 5,
      shortestPathMoves: { fewest: 1, most: 4 },
      seed: 2026,
    };

    // Act
    const result = generatePuzzle(options);

    // Assert
    expect(describePuzzle(result)).toBe("beard-board");
  });

  it("reports failure when no puzzle fits the range", () => {
    // Arrange
    // The farthest apart LADDER's words get is 4 moves.
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(LADDER),
      wordLength: 4,
      shortestPathMoves: { fewest: 5, most: 6 },
      seed: 2026,
    };

    // Act
    const result = generatePuzzle(options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-puzzle-in-range" });
  });

  it("reports failure when there are no puzzle words of the requested length", () => {
    // Arrange
    const options = {
      acceptedWords: createDictionaryFromWords(LADDER),
      puzzleWords: createDictionaryFromWords(LADDER),
      wordLength: 5,
      shortestPathMoves: { fewest: 1, most: 4 },
      seed: 2026,
    };

    // Act
    const result = generatePuzzle(options);

    // Assert
    expect(result).toEqual({ ok: false, reason: "no-puzzle-in-range" });
  });
});
