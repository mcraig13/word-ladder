import { describe, expect, it } from "vitest";
import { createSeededRandom } from "../../src/puzzles/createSeededRandom";

// Chunk 2.1. Rule: the same seed gives the same picks, so everyone gets the
// same puzzle on a date (D5). Picks are from the alphabet so a sequence reads
// as a string.

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

describe("createSeededRandom", () => {
  it("the same seed picks the same sequence", () => {
    // Arrange
    const firstRandom = createSeededRandom(2026);
    const secondRandom = createSeededRandom(2026);
    const secondPicks = Array.from({ length: 20 }, () => secondRandom.pickFrom(ALPHABET)).join("");

    // Act
    const firstPicks = Array.from({ length: 20 }, () => firstRandom.pickFrom(ALPHABET)).join("");

    // Assert
    expect(firstPicks).toBe(secondPicks);
  });

  it("seeds one apart pick different sequences", () => {
    // Arrange
    // Puzzle for a date (2.4) will use seeds close together.
    const firstRandom = createSeededRandom(1);
    const secondRandom = createSeededRandom(2);
    const secondPicks = Array.from({ length: 20 }, () => secondRandom.pickFrom(ALPHABET)).join("");

    // Act
    const firstPicks = Array.from({ length: 20 }, () => firstRandom.pickFrom(ALPHABET)).join("");

    // Assert
    expect(firstPicks).not.toBe(secondPicks);
  });

  it("seed 2026 picks the same sequence it always has", () => {
    // Arrange
    // From a separate BigInt version of mulberry32, not this code. If the
    // generator changes, every puzzle made from a seed changes (D24).
    const random = createSeededRandom(2026);

    // Act
    const picks = Array.from({ length: 10 }, () => random.pickFrom(ALPHABET)).join("");

    // Assert
    expect(picks).toBe("lirqdfruhb");
  });

  it("picks every item in a short list and nothing else", () => {
    // Arrange
    // A pick past the end of the list would show up as undefined.
    const words = ["cold", "cord", "card", "warm"];
    const random = createSeededRandom(7);

    // Act
    const picked = new Set(Array.from({ length: 100 }, () => random.pickFrom(words)));

    // Assert
    expect([...picked].sort()).toEqual(["card", "cold", "cord", "warm"]);
  });

  it("picking from an empty list finds nothing", () => {
    // Arrange
    const noWords: string[] = [];
    const random = createSeededRandom(2026);

    // Act
    const picked = random.pickFrom(noWords);

    // Assert
    expect(picked).toBeUndefined();
  });
});
