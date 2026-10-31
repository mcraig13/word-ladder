// Break-the-code runner for self-review and independent review (sdlc/README.md).
//
//   npm run break -- <breaks.json>
//
// The breaks file is a JSON list of { "label", "file", "find", "replace" }.
// For each break: `find` must occur exactly once in `file` (otherwise the break
// is reported as not applied and skipped), the tests run, the failing tests are
// listed, and the file is put back as it was. A run that crashes, errors or
// takes longer than BREAK_TIMEOUT_SECONDS (default 120) counts as red, with the
// reason. Paths are relative to the folder it is run in, so a reviewer can run
// it in a scratch copy.

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
const timeoutMilliseconds = Number(process.env.BREAK_TIMEOUT_SECONDS ?? 120) * 1000;
let notAppliedCount = 0;
let allGreenCount = 0;

function countOccurrences(text, search) {
  return search === "" ? 0 : text.split(search).length - 1;
}

// The most telling line of a crashed run's error output, e.g. "FATAL ERROR: … heap out of memory".
function getCrashReason(stderr) {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  return (
    lines.find((line) => /fatal error|out of memory/i.test(line)) ??
    lines.find((line) => /error/i.test(line)) ??
    lines.at(-1) ??
    "no error output"
  );
}

// Runs Vitest directly with node, not through a shell, so the timeout kills
// Vitest itself rather than only the shell around it.
function runTestsAndListFailures() {
  rmSync(reportFile, { force: true });
  const run = spawnSync(
    process.execPath,
    ["node_modules/vitest/vitest.mjs", "run", "--reporter=json", `--outputFile=${reportFile}`],
    {
      stdio: ["ignore", "ignore", "pipe"],
      encoding: "utf8",
      timeout: timeoutMilliseconds,
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  if (run.error?.code === "ETIMEDOUT") {
    return [`(test run timed out after ${timeoutMilliseconds / 1000} s)`];
  }
  if (run.error) {
    return [`(test run could not start: ${run.error.message})`];
  }

  let report;
  try {
    report = JSON.parse(readFileSync(reportFile, "utf8"));
  } catch (error) {
    return [
      `(test run crashed, exit ${run.status ?? run.signal}, no readable report: ${getCrashReason(run.stderr)}; ${error.message})`,
    ];
  }
  const failures = report.testResults.flatMap((file) =>
    file.assertionResults.filter((test) => test.status === "failed").map((test) => test.title),
  );
  // A file that fails to load (e.g. a syntax error) has no test results.
  const brokenFiles = report.testResults.filter(
    (file) => file.status === "failed" && file.assertionResults.length === 0,
  );
  const reasons = [
    ...failures,
    ...brokenFiles.map((file) => `(whole file failed to load: ${file.name})`),
  ];
  // A crashed worker or an unhandled error fails the run without failing any test.
  if (reasons.length === 0 && (run.status !== 0 || report.success === false)) {
    reasons.push(
      `(test run crashed, exit ${run.status ?? run.signal}: ${getCrashReason(run.stderr)})`,
    );
  }
  return reasons;
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
