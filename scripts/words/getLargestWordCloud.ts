import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { getWordsOneLetterAway } from "../../src/core/getWordsOneLetterAway";
import { normaliseWord } from "../../src/core/normaliseWord";

/**
 * The words of the largest Word Cloud, in alphabetical order (chunk 6.1b, D8):
 * a group where every word can reach every other by single-letter changes.
 * Words of one length are expected, in any case; [] for no words.
 *
 * Clouds are found in alphabetical order of their first word, and a later
 * cloud replaces the best only if it is strictly bigger, so a tie goes to the
 * cloud with the alphabetically first word, whatever order the words came in.
 */
export function getLargestWordCloud(words: readonly string[]): readonly string[] {
  const dictionary = createDictionaryFromWords(words);
  // Normalised like the dictionary's words, so Cold and cold are one word and
  // entries that aren't words are left out.
  const normalisedWords = words.flatMap((word) => {
    const normalised = normaliseWord(word);
    return normalised.ok ? [normalised.word] : [];
  });
  const wordsInAlphabeticalOrder = [...new Set(normalisedWords)].sort();
  const wordsInACloud = new Set<string>();
  let largestCloud: readonly string[] = [];

  for (const firstWord of wordsInAlphabeticalOrder) {
    if (wordsInACloud.has(firstWord)) {
      continue;
    }

    // Breadth-first search from the first word collects its whole cloud. The
    // loop also visits the words pushed onto the cloud while it runs.
    const cloud = [firstWord];
    wordsInACloud.add(firstWord);
    for (const word of cloud) {
      for (const neighbour of getWordsOneLetterAway(word, dictionary)) {
        if (!wordsInACloud.has(neighbour)) {
          wordsInACloud.add(neighbour);
          cloud.push(neighbour);
        }
      }
    }

    if (cloud.length > largestCloud.length) {
      largestCloud = cloud;
    }
  }

  return [...largestCloud].sort();
}
