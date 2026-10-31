import type { Dictionary } from "./createDictionaryFromWords";
import type { Chain } from "./createGame";
import { getWordsOneLetterAway } from "./getWordsOneLetterAway";
import { normaliseWord } from "./normaliseWord";

export type FindShortestPathResult =
  | { ok: true; path: Chain }
  | { ok: false; reason: "invalid-word" | "different-lengths" | "not-a-word" | "unreachable" };

/**
 * One shortest path from start to target through dictionary words, or the
 * reason there is none (chunk 1.9). Its moves (length minus one) give par,
 * through getPar (D27).
 *
 * Breadth-first search, visiting neighbours in alphabetical order and keeping
 * the first path to each word, so the result is the alphabetically first
 * shortest path and the same on every device.
 */
export function findShortestPath(
  start: string,
  target: string,
  dictionary: Dictionary,
): FindShortestPathResult {
  const normalisedStart = normaliseWord(start);
  const normalisedTarget = normaliseWord(target);

  if (!normalisedStart.ok || !normalisedTarget.ok) {
    return { ok: false, reason: "invalid-word" };
  }

  const startWord = normalisedStart.word;
  const targetWord = normalisedTarget.word;

  if (startWord.length !== targetWord.length) {
    return { ok: false, reason: "different-lengths" };
  }

  if (!dictionary.containsWord(startWord) || !dictionary.containsWord(targetWord)) {
    return { ok: false, reason: "not-a-word" };
  }

  // Each entry is a word and the first path found to it. Whole paths are kept,
  // rather than a link back to the previous word, so they stay typed as Chain.
  const pathsToExplore: { word: string; path: Chain }[] = [{ word: startWord, path: [startWord] }];
  const reachedWords = new Set([startWord]);

  for (const { word, path } of pathsToExplore) {
    if (word === targetWord) {
      return { ok: true, path };
    }

    for (const nextWord of getWordsOneLetterAway(word, dictionary)) {
      if (!reachedWords.has(nextWord)) {
        reachedWords.add(nextWord);
        pathsToExplore.push({ word: nextWord, path: [...path, nextWord] });
      }
    }
  }

  return { ok: false, reason: "unreachable" };
}
