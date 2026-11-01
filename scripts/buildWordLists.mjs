// Builds the accepted and puzzle word lists from the SCOWL sources (chunk 6.1b).
//
//   npm run build:words
//
// All the logic is in scripts/words/getWordLists.ts, which this loads through
// Vite's runnerImport so the TypeScript imports work unchanged (6.1b intent,
// choice 1). On a failure it prints `<file>:<line> <reason>` and exits 1,
// writing nothing. Never edit the built lists by hand (CLAUDE.md, Don'ts).

import console from "node:console";
import process from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { runnerImport } from "vite";

const sourceFolder = "data/source/scowl";
const wordsFolder = "data/words";

const sourceFiles = {
  accepted: {
    affix: `${sourceFolder}/en_GB-large/en_GB-large.aff`,
    dictionary: `${sourceFolder}/en_GB-large/en_GB-large.dic`,
  },
  puzzle: {
    affix: `${sourceFolder}/en_GB-ise/en_GB-ise.aff`,
    dictionary: `${sourceFolder}/en_GB-ise/en_GB-ise.dic`,
  },
};
const exclusionFile = `${wordsFolder}/exclude.txt`;
const blocklistFile = `${wordsFolder}/blocklist.txt`;

function readText(file) {
  return readFileSync(file, "utf8");
}

function readSource(files) {
  return { affixText: readText(files.affix), dictionaryText: readText(files.dictionary) };
}

// One word per line, LF, a newline at the end, no comments.
function writeWordList(file, words) {
  writeFileSync(file, words.map((word) => `${word}\n`).join(""));
  console.log(`Wrote ${words.length} words to ${file}`);
}

const { module } = await runnerImport("./scripts/words/getWordLists.ts", { configFile: false });

const result = module.getWordLists({
  acceptedWordsSource: readSource(sourceFiles.accepted),
  puzzleWordsSource: readSource(sourceFiles.puzzle),
  exclusionListText: readText(exclusionFile),
  blocklistText: readText(blocklistFile),
  wordLength: 4,
});

if (!result.ok) {
  const failedFile = {
    affix: sourceFiles[result.wordList].affix,
    dictionary: sourceFiles[result.wordList].dictionary,
    exclusion: exclusionFile,
    blocklist: blocklistFile,
  }[result.file];
  console.error(`${failedFile}:${result.lineNumber} ${result.reason}`);
  process.exit(1);
}

writeWordList(`${wordsFolder}/accepted.txt`, result.acceptedWords);
writeWordList(`${wordsFolder}/puzzle.txt`, result.puzzleWords);
