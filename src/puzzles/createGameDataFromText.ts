import { createDictionaryFromWords, type Dictionary } from "../core/createDictionaryFromWords";
import { createScheduleFromText } from "./createScheduleFromText";
import type { Schedule } from "./extendSchedule";

/**
 * Everything the daily game reads at start (chunk 1.11). Start and target come
 * from the puzzle words; moves are checked against the accepted words, so the
 * two stay separate (D8). Line N of the schedule is puzzle #N (D24).
 */
export interface GameData {
  acceptedWords: Dictionary;
  puzzleWords: Dictionary;
  schedule: Schedule;
}

export interface GameDataTexts {
  acceptedWordsText: string;
  puzzleWordsText: string;
  scheduleText: string;
}

export type CreateGameDataResult =
  | { ok: true; gameData: GameData }
  | { ok: false; reason: "unreadable-schedule-line"; lineNumber: number };

/**
 * The game data in the files' text: one word per line, and the schedule as
 * createScheduleFromText reads it. The empty piece after a list's final
 * newline isn't a word, so createDictionaryFromWords skips it (1.2).
 */
export function createGameDataFromText(texts: GameDataTexts): CreateGameDataResult {
  const scheduleResult = createScheduleFromText(texts.scheduleText);
  if (!scheduleResult.ok) {
    return {
      ok: false,
      reason: "unreadable-schedule-line",
      lineNumber: scheduleResult.lineNumber,
    };
  }

  return {
    ok: true,
    gameData: {
      acceptedWords: createDictionaryFromWords(texts.acceptedWordsText.split("\n")),
      puzzleWords: createDictionaryFromWords(texts.puzzleWordsText.split("\n")),
      schedule: scheduleResult.schedule,
    },
  };
}
