// Builds the puzzle schedule from the built word lists (chunk 2.6a).
//
//   npm run build:schedule [-- schedule file]
//
// The schedule file defaults to data/puzzles/schedule.txt; a test passes a
// copy (chunk 2.6c).
//
// All the logic is in src/puzzles/getExtendedScheduleText.ts. It reads
// schedule.txt, keeps every line in it exactly as it is, and adds puzzles
// after it up to a year ahead of today's (chunk 2.6b, D24). To rebuild from
// puzzle #1, which D24 allows only before launch, delete schedule.txt and run
// it. Before writing, it checks the whole schedule, old lines and new,
// against the word lists, D30's repeat window, D16's range for puzzles after
// today's and the 60 puzzles that must remain after today's (chunks 2.6c and
// 2.3, D24). On a failure it prints the unreadable line, the failing puzzle's
// number, or how few puzzles remain, and exits 1, writing nothing. A full
// rebuild takes about 15 s.

import console from "node:console";
import process from "node:process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createDictionaryFromWords } from "../src/core/createDictionaryFromWords.ts";
import { getExtendedScheduleText } from "../src/puzzles/getExtendedScheduleText.ts";

const wordsFolder = "data/words";
const scheduleFile = process.argv[2] ?? "data/puzzles/schedule.txt";

// Any fixed whole number; changing it reshuffles every unpublished date.
const scheduleSeed = 2026;
// Before launch today is #0, so nothing is published. 3.8 sets the launch
// date and works this out from today's date (2.6b intent).
const todaysPuzzleNumber = 0;
// About a year ahead of today's puzzle (D24).
const puzzlesAhead = 365;
// A shortest path of 4-6 moves, par 6-9 (D16, D27). The checks hold every
// puzzle after today's to it (chunk 2.3).
const shortestPathMoves = { fewest: 4, most: 6 };
const wordLength = 4;
// No start or target comes back within 90 days (D30).
const daysBeforeWordRepeats = 90;
// The build fails with fewer than 60 puzzles after today's (D24).
const fewestPuzzlesAhead = 60;

function readWordList(file) {
  return createDictionaryFromWords(readFileSync(file, "utf8").split("\n"));
}

const scheduleText = existsSync(scheduleFile) ? readFileSync(scheduleFile, "utf8") : "";

const result = getExtendedScheduleText(scheduleText, {
  acceptedWords: readWordList(`${wordsFolder}/accepted.txt`),
  puzzleWords: readWordList(`${wordsFolder}/puzzle.txt`),
  wordLength,
  shortestPathMoves,
  scheduleSeed,
  daysBeforeWordRepeats,
  todaysPuzzleNumber,
  puzzlesAhead,
  fewestPuzzlesAhead,
});

if (!result.ok) {
  if (result.reason === "unreadable-line") {
    console.error(`${scheduleFile} line ${result.lineNumber}: ${result.reason}`);
  } else if (result.reason === "too-few-puzzles-ahead") {
    console.error(`${scheduleFile}: ${result.reason} (${result.puzzlesAhead} ahead)`);
  } else {
    console.error(`Puzzle #${result.puzzleNumber}: ${result.reason}`);
  }
  process.exit(1);
}

// One newline after each puzzle's line.
function countPuzzles(text) {
  return text.split("\n").length - 1;
}

mkdirSync(dirname(scheduleFile), { recursive: true });
writeFileSync(scheduleFile, result.scheduleText);
const puzzleCount = countPuzzles(result.scheduleText);
const addedCount = puzzleCount - countPuzzles(scheduleText);
console.log(`Wrote ${puzzleCount} puzzles to ${scheduleFile}, ${addedCount} added`);
