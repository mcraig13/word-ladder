import { describe, expect, it } from "vitest";
import { getBundledGameData } from "../../src/puzzles/getBundledGameData";
import acceptedWordsText from "../../data/words/accepted.txt?raw";
import puzzleWordsText from "../../data/words/puzzle.txt?raw";
import scheduleText from "../../data/puzzles/schedule.txt?raw";

// Chunk 1.11. These check the committed files as the app gets them. They use
// counts and the rules' example rather than particular lines, so they stay true
// when 6.2 and 6.3 rebuild the lists and the schedule.

// Start and target words are 4 letters (CLAUDE.md, The puzzle; D4).
const WORD_LENGTH = 4;

// Each file has one entry per line and a newline after each (6.1b, 2.6b), so
// the pieces after splitting on newlines are one more than the lines.
function countLines(text: string) {
  return text.split("\n").length - 1;
}

describe("getBundledGameData", () => {
  it("every puzzle word is also an accepted word", () => {
    // Arrange
    const expectedWordsMissing: string[] = [];

    // Act
    const result = getBundledGameData();

    // Assert
    const wordsMissing = result.ok
      ? result.gameData.puzzleWords
          .getWordsOfLength(WORD_LENGTH)
          .filter((word) => !result.gameData.acceptedWords.containsWord(word))
      : ["(the bundled data did not load)"];
    expect(wordsMissing).toEqual(expectedWordsMissing);
  });

  it("the bundled accepted words are the words in accepted.txt, counted by line", () => {
    // Arrange
    const lineCount = countLines(acceptedWordsText);

    // Act
    const result = getBundledGameData();

    // Assert
    expect(result.ok && result.gameData.acceptedWords.getWordsOfLength(WORD_LENGTH).length).toBe(
      lineCount,
    );
  });

  it("the bundled puzzle words are the words in puzzle.txt, counted by line", () => {
    // Arrange
    const lineCount = countLines(puzzleWordsText);

    // Act
    const result = getBundledGameData();

    // Assert
    expect(result.ok && result.gameData.puzzleWords.getWordsOfLength(WORD_LENGTH).length).toBe(
      lineCount,
    );
  });

  it("the bundled schedule has one puzzle for each line of schedule.txt", () => {
    // Arrange
    const lineCount = countLines(scheduleText);

    // Act
    const result = getBundledGameData();

    // Assert
    expect(result.ok && result.gameData.schedule.length).toBe(lineCount);
  });

  it("the bundled accepted words include every word in the rules' example", () => {
    // Arrange
    const exampleChain = ["cold", "cord", "card", "ward", "warm"];

    // Act
    const result = getBundledGameData();

    // Assert
    const wordsMissing = result.ok
      ? exampleChain.filter((word) => !result.gameData.acceptedWords.containsWord(word))
      : exampleChain;
    expect(wordsMissing).toEqual([]);
  });
});
