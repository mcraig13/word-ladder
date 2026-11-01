import { describe, expect, it } from "vitest";
import { getLargestWordCloud } from "../../../scripts/words/getLargestWordCloud";

// Chunk 6.1b. Rule: accepted words are the largest Word Cloud, a group where
// every word can reach every other by single-letter changes (D8). The result
// is the same whatever order the words come in (6.1b, "the same inputs always
// produce the same output files").

describe("getLargestWordCloud", () => {
  it("keeps the largest cloud and drops the smaller ones", () => {
    // Arrange
    // cold-cord-card-ward-warm is one cloud of 5; opal-oral-oval is a cloud
    // of 3; evil is one letter from nothing.
    const words = ["cold", "cord", "card", "ward", "warm", "opal", "oral", "oval", "evil"];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual(["card", "cold", "cord", "ward", "warm"]);
  });

  it("keeps words that are joined only through a chain of moves", () => {
    // Arrange
    // warm is four moves from cold and joined to it only through cord, card
    // and ward; opal-oral is a cloud of 2.
    const words = ["warm", "opal", "ward", "oral", "card", "cord", "cold"];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual(["card", "cold", "cord", "ward", "warm"]);
  });

  it("chooses the cloud with the alphabetically first word when two clouds are the same size", () => {
    // Arrange
    // cold-cord and able-axle are both clouds of 2; able comes first.
    const words = ["cold", "cord", "able", "axle"];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual(["able", "axle"]);
  });

  it("gives the same cloud, in alphabetical order, whatever order the words come in", () => {
    // Arrange
    const words = ["warm", "axle", "ward", "able", "cord", "card", "cold"];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual(["card", "cold", "cord", "ward", "warm"]);
  });

  it("counts a word given twice once when comparing cloud sizes", () => {
    // Arrange
    // able-axle is a cloud of 2. cold is given three times but is a cloud of 1.
    const words = ["cold", "cold", "cold", "able", "axle"];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual(["able", "axle"]);
  });

  it("has no cloud when there are no words", () => {
    // Arrange
    const words: string[] = [];

    // Act
    const result = getLargestWordCloud(words);

    // Assert
    expect(result).toEqual([]);
  });
});
