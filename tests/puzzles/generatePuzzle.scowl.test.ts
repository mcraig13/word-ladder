import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { findShortestPath } from "../../src/core/findShortestPath";
import { generatePuzzle } from "../../src/puzzles/generatePuzzle";
import acceptedText from "../../data/words/accepted.txt?raw";
import puzzleText from "../../data/words/puzzle.txt?raw";

// Chunk 2.2 smoke check on the real word lists (D17). The small fixtures in
// generatePuzzle.test.ts pin the rules; this checks they hold at full size,
// and that one puzzle comes back inside the test timeout, as 2.6 needs it to
// a year of times over. The range is D16's suggestion until 2.3 sets it.

describe("generatePuzzle on the real word lists", () => {
  it("a puzzle from the real word lists has a shortest path in the requested range", () => {
    // Arrange
    const acceptedWords = createDictionaryFromWords(acceptedText.split("\n"));
    const puzzleWords = createDictionaryFromWords(puzzleText.split("\n"));
    const options = {
      acceptedWords,
      puzzleWords,
      wordLength: 4,
      shortestPathMoves: { fewest: 4, most: 6 },
      seed: 2026,
    };

    // Act
    const result = generatePuzzle(options);

    // Assert
    expect(result.ok).toBe(true);
    const puzzle = result.ok ? result.puzzle : { start: "", target: "" };
    const shortestPath = findShortestPath(puzzle.start, puzzle.target, acceptedWords);
    const shortestPathMoves = shortestPath.ok ? shortestPath.path.length - 1 : 0;
    expect(puzzleWords.containsWord(puzzle.start)).toBe(true);
    expect(puzzleWords.containsWord(puzzle.target)).toBe(true);
    expect(shortestPathMoves).toBeGreaterThanOrEqual(4);
    expect(shortestPathMoves).toBeLessThanOrEqual(6);
  });
});
