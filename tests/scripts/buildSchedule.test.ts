// The only test that runs a script, so the only file that needs Node's types.
/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import committedScheduleText from "../../data/puzzles/schedule.txt?raw";

// Chunk 2.6c, for 2.6b review B4. build:schedule reads the schedule file and
// extends it; it never rebuilds from #1 once the file exists (D24). A rebuild
// of the committed file would give the committed file back, so the copy here
// has its first two lines swapped: still a schedule that passes the checks,
// but not the one a rebuild would write. The copy also lacks the last line,
// so a script that ignored the copy and left it alone would fail too. Puzzle
// #365 depends only on its number and the 90 puzzles before it (D30), so the
// script adds back the committed line.

// The script's checks run one shortest-path search per puzzle, about 25 s for
// 365 puzzles before 2.6c sped up the neighbour lookup, and about 5 s after;
// the timeout leaves room. spawnSync can't be interrupted by Vitest, so the
// script gets the same limit itself.
const WHOLE_SCHEDULE_TIMEOUT_MILLISECONDS = 60_000;

describe("scripts/buildSchedule.mjs", () => {
  it(
    "the build script keeps the lines of the file it reads rather than rebuilding them",
    { timeout: WHOLE_SCHEDULE_TIMEOUT_MILLISECONDS },
    () => {
      // Arrange
      const [firstLine = "", secondLine = "", ...otherLines] = committedScheduleText.split("\n");
      const swappedText = [secondLine, firstLine, ...otherLines].join("\n");
      // The text ends with a newline, so the last line starts after the one before it.
      const withoutLastLine = swappedText.slice(
        0,
        swappedText.lastIndexOf("\n", swappedText.length - 2) + 1,
      );
      const scheduleFolder = mkdtempSync(join(tmpdir(), "schedule-"));
      const scheduleFile = join(scheduleFolder, "schedule.txt");
      writeFileSync(scheduleFile, withoutLastLine);

      // Act
      const run = spawnSync(
        process.execPath,
        ["--import", "tsx", "scripts/buildSchedule.mjs", scheduleFile],
        { timeout: WHOLE_SCHEDULE_TIMEOUT_MILLISECONDS },
      );
      const text = readFileSync(scheduleFile, "utf8");
      rmSync(scheduleFolder, { recursive: true });

      // Assert
      // stderr is checked too, so a failure shows the script's reason.
      expect({ exitCode: run.status, errors: run.stderr.toString(), text }).toEqual({
        exitCode: 0,
        errors: "",
        text: swappedText,
      });
    },
  );
});
