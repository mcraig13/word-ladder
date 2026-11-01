// Builds the puzzle schedule from the built word lists (chunk 2.6a).
//
//   npm run build:schedule
//
// All the logic is in src/puzzles/extendSchedule.ts. Until 2.6b it always
// rebuilds from puzzle #1, which D24 allows before launch. On a failure it
// prints the puzzle number with no puzzle in range and exits 1, writing
// nothing. It takes about a minute.

import console from "node:console";
import process from "node:process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createDictionaryFromWords } from "../src/core/createDictionaryFromWords.ts";
import { extendSchedule } from "../src/puzzles/extendSchedule.ts";
import { getScheduleText } from "../src/puzzles/getScheduleText.ts";

const wordsFolder = "data/words";
const puzzlesFolder = "data/puzzles";
const scheduleFile = `${puzzlesFolder}/schedule.txt`;

// Any fixed whole number; changing it reshuffles every unpublished date.
const scheduleSeed = 2026;
// About a year ahead (D24).
const puzzlesInSchedule = 365;
// D16's suggested range, until 2.3 agrees one.
const shortestPathMoves = { fewest: 4, most: 6 };
const wordLength = 4;
// No start or target comes back within 90 days (D30).
const daysBeforeWordRepeats = 90;

function readWordList(file) {
  return createDictionaryFromWords(readFileSync(file, "utf8").split("\n"));
}

const result = extendSchedule([], {
  acceptedWords: readWordList(`${wordsFolder}/accepted.txt`),
  puzzleWords: readWordList(`${wordsFolder}/puzzle.txt`),
  wordLength,
  shortestPathMoves,
  scheduleSeed,
  daysBeforeWordRepeats,
  lastPuzzleNumber: puzzlesInSchedule,
});

if (!result.ok) {
  console.error(`Puzzle #${result.puzzleNumber}: ${result.reason}`);
  process.exit(1);
}

mkdirSync(puzzlesFolder, { recursive: true });
writeFileSync(scheduleFile, getScheduleText(result.schedule));
console.log(`Wrote ${result.schedule.length} puzzles to ${scheduleFile}`);
