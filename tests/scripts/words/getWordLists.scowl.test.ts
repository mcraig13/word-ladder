import { describe, expect, it } from "vitest";
import { getWordLists } from "../../../scripts/words/getWordLists";
import {
  createDictionaryFromWords,
  type Dictionary,
} from "../../../src/core/createDictionaryFromWords";
import { findShortestPath } from "../../../src/core/findShortestPath";
import { getWordsOneLetterAway } from "../../../src/core/getWordsOneLetterAway";
import largeAffixText from "../../../data/source/scowl/en_GB-large/en_GB-large.aff?raw";
import largeDictionaryText from "../../../data/source/scowl/en_GB-large/en_GB-large.dic?raw";
import iseAffixText from "../../../data/source/scowl/en_GB-ise/en_GB-ise.aff?raw";
import iseDictionaryText from "../../../data/source/scowl/en_GB-ise/en_GB-ise.dic?raw";
import exclusionListText from "../../../data/words/exclude.txt?raw";
import blocklistText from "../../../data/words/blocklist.txt?raw";
import committedAcceptedText from "../../../data/words/accepted.txt?raw";
import committedPuzzleText from "../../../data/words/puzzle.txt?raw";

// Chunk 6.1b smoke check on the real SCOWL files (D17). The committed lists
// must match a fresh build, so a list edited by hand or left stale after a
// source change fails here (CLAUDE.md, Don'ts). Expected words come from D17's
// evidence and the CLAUDE.md example, not from running the build.

const realSources = {
  acceptedWordsSource: { affixText: largeAffixText, dictionaryText: largeDictionaryText },
  puzzleWordsSource: { affixText: iseAffixText, dictionaryText: iseDictionaryText },
  exclusionListText,
  blocklistText,
  wordLength: 4,
};

// A built list file: one word per line.
function getWordsFromListFile(text: string): string[] {
  return text.split("\n").filter((line) => line !== "");
}

// The file format the build writes (6.1b intent, choice 5): one word per line,
// LF, a newline at the end, so a blank line added by hand fails the check.
function createListFileText(words: readonly string[]): string {
  return words.map((word) => `${word}\n`).join("");
}

// Every dictionary word a chain of moves can reach from the start word. A
// property check of the built list, using the core move rule, not the build's
// own cloud search.
function getWordsReachableFrom(start: string, dictionary: Dictionary): Set<string> {
  const reachedWords = new Set([start]);
  for (const word of reachedWords) {
    for (const neighbour of getWordsOneLetterAway(word, dictionary)) {
      reachedWords.add(neighbour);
    }
  }
  return reachedWords;
}

describe("getWordLists on the real SCOWL files", () => {
  it("builds the same accepted words as the committed accepted.txt", () => {
    // Arrange
    const input = realSources;

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result.ok && createListFileText(result.acceptedWords)).toBe(committedAcceptedText);
  });

  it("builds the same puzzle words as the committed puzzle.txt", () => {
    // Arrange
    const input = realSources;

    // Act
    const result = getWordLists(input);

    // Assert
    expect(result.ok && createListFileText(result.puzzleWords)).toBe(committedPuzzleText);
  });

  it("makes cold, warm and high puzzle words, high being joined only through size-70 words", () => {
    // Arrange
    const input = realSources;

    // Act
    const result = getWordLists(input);

    // Assert
    const puzzleWords = result.ok ? result.puzzleWords : [];
    expect(puzzleWords).toEqual(expect.arrayContaining(["cold", "warm", "high"]));
  });

  it("makes every puzzle word an accepted word, so every puzzle is inside the cloud", () => {
    // Arrange
    const input = realSources;

    // Act
    const result = getWordLists(input);

    // Assert
    const acceptedWords = new Set(result.ok ? result.acceptedWords : []);
    const puzzleWords = result.ok ? result.puzzleWords : ["no lists were built"];
    expect(puzzleWords.filter((word) => !acceptedWords.has(word))).toEqual([]);
  });

  it("connects every accepted word to every other, so every puzzle is solvable", () => {
    // Arrange
    const acceptedWords = getWordsFromListFile(committedAcceptedText);
    const dictionary = createDictionaryFromWords(acceptedWords);

    // Act
    // Moves work both ways, so if every word reaches one word, any two words
    // reach each other through it. cold is only where the search starts.
    const reachedWords = getWordsReachableFrom("cold", dictionary);

    // Assert
    // cold is checked too, so an empty list can't pass with nothing to reach.
    expect(acceptedWords).toContain("cold");
    expect(acceptedWords.filter((word) => !reachedWords.has(word))).toEqual([]);
  });

  it("does not accept evil, exam or hymn, which are outside the cloud at any size", () => {
    // Arrange
    const input = realSources;

    // Act
    const result = getWordLists(input);

    // Assert
    const acceptedWords = result.ok ? result.acceptedWords : [];
    expect(acceptedWords).not.toContain("evil");
    expect(acceptedWords).not.toContain("exam");
    expect(acceptedWords).not.toContain("hymn");
  });

  it("finds a 4-move shortest path from cold to warm over the committed accepted words", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(getWordsFromListFile(committedAcceptedText));

    // Act
    const result = findShortestPath("cold", "warm", dictionary);

    // Assert
    expect(result.ok && result.path.length - 1).toBe(4);
  });
});
