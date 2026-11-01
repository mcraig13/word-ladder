import { getLargestWordCloud } from "./getLargestWordCloud";
import { getWordsFromHunspell, type GetWordsFromHunspellResult } from "./getWordsFromHunspell";

/** One SCOWL Hunspell dictionary: its .aff and .dic text. */
export interface HunspellSource {
  affixText: string;
  dictionaryText: string;
}

export interface WordListSources {
  /** The size-70 list, en_GB-large (D17). */
  acceptedWordsSource: HunspellSource;
  /** The size-60 list, en_GB-ise (D17). */
  puzzleWordsSource: HunspellSource;
  exclusionListText: string;
  blocklistText: string;
  wordLength: number;
}

export type WordList = "accepted" | "puzzle";

export type GetWordListsResult =
  | { ok: true; acceptedWords: readonly string[]; puzzleWords: readonly string[] }
  | (Extract<GetWordsFromHunspellResult, { ok: false }> & { wordList: WordList });

/**
 * The accepted and puzzle word lists (chunk 6.1b, D8, D17). Accepted words are
 * the largest Word Cloud of the cleaned size-70 list; puzzle words are the
 * size-60 words in it, so every puzzle is solvable. Both are in alphabetical
 * order. The exclusion list and blocklist apply before the cloud is found.
 */
export function getWordLists(sources: WordListSources): GetWordListsResult {
  const { exclusionListText, blocklistText, wordLength } = sources;

  const acceptedSourceWords = getWordsFromHunspell({
    ...sources.acceptedWordsSource,
    exclusionListText,
    blocklistText,
  });
  if (!acceptedSourceWords.ok) {
    return { ...acceptedSourceWords, wordList: "accepted" };
  }

  const puzzleSourceWords = getWordsFromHunspell({
    ...sources.puzzleWordsSource,
    exclusionListText,
    blocklistText,
  });
  if (!puzzleSourceWords.ok) {
    return { ...puzzleSourceWords, wordList: "puzzle" };
  }

  const acceptedWords = getLargestWordCloud(
    acceptedSourceWords.words.filter((word) => word.length === wordLength),
  );
  const acceptedWordSet = new Set(acceptedWords);
  // Already in alphabetical order, as getWordsFromHunspell returns them.
  const puzzleWords = puzzleSourceWords.words.filter((word) => acceptedWordSet.has(word));

  return { ok: true, acceptedWords, puzzleWords };
}
