import { normaliseWord } from "./normaliseWord";

/**
 * A lookup of accepted words (chunk 1.2). Every word is stored normalised:
 * lowercase, letters a–z only.
 */
export interface Dictionary {
  /** Whether the word is in the dictionary, whatever case it is given in. */
  containsWord(word: string): boolean;
  /** Every word with this many letters, in alphabetical order. */
  getWordsOfLength(length: number): readonly string[];
}

export function createDictionaryFromWords(words: Iterable<string>): Dictionary {
  const uniqueWords = new Set<string>();

  for (const entry of words) {
    const normalised = normaliseWord(entry);
    if (normalised.ok) {
      uniqueWords.add(normalised.word);
    }
  }

  // Default sort compares character codes, which is alphabetical for a–z and,
  // unlike localeCompare, gives the same order on every device. The daily
  // puzzle depends on that order being stable.
  const wordsInAlphabeticalOrder = [...uniqueWords].sort();

  return {
    containsWord(word) {
      const normalised = normaliseWord(word);
      return normalised.ok && uniqueWords.has(normalised.word);
    },
    getWordsOfLength(length) {
      return wordsInAlphabeticalOrder.filter((word) => word.length === length);
    },
  };
}
