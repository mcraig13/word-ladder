import { describe, expect, it } from "vitest";
import { areWordsOneLetterApart } from "../../src/core/areWordsOneLetterApart";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { findShortestPath } from "../../src/core/findShortestPath";

// Chunk 1.9. Rules: par is the number of moves in a shortest path over the
// accepted words (D9). Every step changes one letter in the same position and
// is an accepted word (CLAUDE.md, Moves). The same inputs always give the same
// path, so every player sees the same one (D6).

describe("findShortestPath", () => {
  it("finds a path whose length is the fewest moves between two words", () => {
    // Arrange
    // Via "cord" takes 4 moves. Via "bold" takes 5 and via "hold" 6: one comes
    // before "cord" alphabetically and one after, so a depth-first search would
    // take a longer route whichever order it tried.
    const shortRoute = ["cold", "cord", "card", "ward", "warm"];
    const longerRoutes = ["bold", "bald", "bard", "hold", "held", "herd", "hard"];
    const dictionary = createDictionaryFromWords([...shortRoute, ...longerRoutes]);

    // Act
    const result = findShortestPath("cold", "warm", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "cord", "card", "ward", "warm"] });
  });

  it("every step of the path is one letter apart and in the dictionary", () => {
    // Arrange
    // Two shortest paths (via "card" and via "word") and a longer one via "bold".
    const words = ["cold", "bold", "bald", "bard", "cord", "card", "ward", "warm", "word", "worm"];
    const dictionary = createDictionaryFromWords(words);

    // Act
    const result = findShortestPath("cold", "warm", dictionary);

    // Assert
    const path = result.ok ? result.path : [];
    expect(path.length).toBeGreaterThan(1);
    for (const [position, word] of path.slice(1).entries()) {
      expect(areWordsOneLetterApart(path[position] ?? "", word)).toBe(true);
      expect(dictionary.containsWord(word)).toBe(true);
    }
  });

  it("path starts at the start word and ends at the target", () => {
    // Arrange
    const words = ["cold", "bold", "bald", "bard", "cord", "card", "ward", "warm", "word", "worm"];
    const dictionary = createDictionaryFromWords(words);

    // Act
    const result = findShortestPath("cold", "warm", dictionary);

    // Assert
    const path = result.ok ? result.path : [];
    expect([path[0], path.at(-1)]).toEqual(["cold", "warm"]);
  });

  it("does not take a shortcut that changes two letters", () => {
    // Arrange
    // "cold" to "card" changes two letters, so it must go via "cord".
    const dictionary = createDictionaryFromWords(["cold", "cord", "card"]);

    // Act
    const result = findShortestPath("cold", "card", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "cord", "card"] });
  });

  it("does not take a shortcut that moves letters", () => {
    // Arrange
    // "load" has the letters of "cold" with one changed, but not in the same places.
    const dictionary = createDictionaryFromWords(["cold", "cord", "lord", "load"]);

    // Act
    const result = findShortestPath("cold", "load", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "cord", "lord", "load"] });
  });

  it("does not step through a word that is not in the dictionary", () => {
    // Arrange
    // "bold" is a real word one letter from both ends, and alphabetically
    // before "colt", but it isn't listed.
    const dictionary = createDictionaryFromWords(["cold", "colt", "bolt"]);

    // Act
    const result = findShortestPath("cold", "bolt", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "colt", "bolt"] });
  });

  it("returns the alphabetically first shortest path when there are several", () => {
    // Arrange
    // Two paths of 2 moves: via "bold" and via "colt". Listed with "colt" first.
    const dictionary = createDictionaryFromWords(["colt", "bolt", "cold", "bold"]);

    // Act
    const result = findShortestPath("cold", "bolt", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "bold", "bolt"] });
  });

  it("returns a single-word path when start equals target", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = findShortestPath("cold", "cold", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold"] });
  });

  it("ignores the case of the start and target and returns the path in lowercase", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord", "card"]);

    // Act
    const result = findShortestPath("COLD", "Card", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "cord", "card"] });
  });

  it("ignores spaces around the start and target", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord", "card"]);

    // Act
    const result = findShortestPath(" cold", "card ", dictionary);

    // Assert
    expect(result).toEqual({ ok: true, path: ["cold", "cord", "card"] });
  });

  it("returns no path, with reason unreachable, when the target is unreachable", () => {
    // Arrange
    // "cord" is one move from "cold", but nothing leads on to "warm".
    const dictionary = createDictionaryFromWords(["cold", "cord", "warm"]);

    // Act
    const result = findShortestPath("cold", "warm", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreachable" });
  });

  it("returns no path, with reason different-lengths, for words of different lengths", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "colds"]);

    // Act
    const result = findShortestPath("cold", "colds", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "different-lengths" });
  });

  it("returns no path, with reason not-a-word, when the start is not in the dictionary", () => {
    // Arrange
    // "colt" is one letter from "cold", so a search that didn't check the
    // start would find colt → cold → cord.
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = findShortestPath("colt", "cord", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("returns no path, with reason not-a-word, when the target is not in the dictionary", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = findShortestPath("cold", "card", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "not-a-word" });
  });

  it("returns no path, with reason invalid-word, when given something that is not a word", () => {
    // Arrange
    const dictionary = createDictionaryFromWords(["cold", "cord"]);

    // Act
    const result = findShortestPath("co1d", "cord", dictionary);

    // Assert
    expect(result).toEqual({ ok: false, reason: "invalid-word" });
  });
});
