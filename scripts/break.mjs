// Break-the-code runner for self-review and independent review (sdlc/README.md).
//
//   npm run break -- <breaks.json>
//
// The breaks file is a JSON list of { "label", "file", "find", "replace" }.
// For each break: `find` must occur exactly once in `file` (otherwise the break
// is reported as not applied and skipped), the tests run, the failing tests are
// listed, and the file is put back as it was. Paths are relative to the folder
// it is run in, so a reviewer can run it in a scratch copy.

import { spawnSync } from "node:child_process";
import console from "node:console";
import process from "node:process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const breaksFile = process.argv[2];
if (!breaksFile) {
  console.error("Usage: npm run break -- <breaks.json>");
  process.exit(2);
}

const breaks = JSON.parse(readFileSync(breaksFile, "utf8"));
const reportFolder = mkdtempSync(join(tmpdir(), "breaks-"));
const reportFile = join(reportFolder, "report.json");
let notAppliedCount = 0;
let allGreenCount = 0;

function countOccurrences(text, search) {
  return search === "" ? 0 : text.split(search).length - 1;
}

function runTestsAndListFailures() {
  spawnSync("npx", ["vitest", "run", "--reporter=json", `--outputFile=${reportFile}`], {
    shell: true,
    stdio: "ignore",
  });
  const report = JSON.parse(readFileSync(reportFile, "utf8"));
  const failures = report.testResults.flatMap((file) =>
    file.assertionResults.filter((test) => test.status === "failed").map((test) => test.title),
  );
  // A file that fails to load (e.g. a syntax error) has no test results.
  const brokenFiles = report.testResults.filter(
    (file) => file.status === "failed" && file.assertionResults.length === 0,
  );
  return [...failures, ...brokenFiles.map((file) => `(whole file failed to load: ${file.name})`)];
}

try {
  for (const { label, file, find, replace } of breaks) {
    const original = readFileSync(file, "utf8");
    const occurrences = countOccurrences(original, find);
    if (occurrences !== 1) {
      console.log(`### ${label}\nNOT APPLIED: "find" occurs ${occurrences} times in ${file}\n`);
      notAppliedCount++;
      continue;
    }

    writeFileSync(
      file,
      original.replace(find, () => replace),
    );
    try {
      const failures = runTestsAndListFailures();
      if (failures.length === 0) {
        allGreenCount++;
        console.log(`### ${label}\nALL GREEN: no test protects this\n`);
      } else {
        console.log(`### ${label}\nred: ${failures.join("; ")}\n`);
      }
    } finally {
      writeFileSync(file, original);
    }
  }
} finally {
  rmSync(reportFolder, { recursive: true, force: true });
}

console.log(`${breaks.length} breaks: ${notAppliedCount} not applied, ${allGreenCount} all green.`);
process.exit(notAppliedCount > 0 || allGreenCount > 0 ? 1 : 0);
