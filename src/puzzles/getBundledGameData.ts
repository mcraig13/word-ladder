import acceptedWordsText from "../../data/words/accepted.txt?raw";
import puzzleWordsText from "../../data/words/puzzle.txt?raw";
import scheduleText from "../../data/puzzles/schedule.txt?raw";
import { createGameDataFromText, type CreateGameDataResult } from "./createGameDataFromText";

/**
 * The game data from the committed word lists and schedule, bundled at build
 * time, so there's no fetch at runtime (chunk 1.11). CI checks the committed
 * schedule, so `ok: false` shouldn't happen; 3.1 decides what the player sees
 * if it does.
 */
export function getBundledGameData(): CreateGameDataResult {
  return createGameDataFromText({ acceptedWordsText, puzzleWordsText, scheduleText });
}
