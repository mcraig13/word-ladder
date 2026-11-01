// The only test that runs a script, so the only file that needs Node's types.
/// <reference types="node" />
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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
// 365 puzzles.
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
      const scheduleFile = join(mkdtempSync(join(tmpdir(), "schedule-")), "schedule.txt");
      writeFileSync(scheduleFile, withoutLastLine);

      // Act
      const run = spawnSync(process.execPath, [
        "--import",
        "tsx",
        "scripts/buildSchedule.mjs",
        scheduleFile,
      ]);

      // Assert
      expect({ exitCode: run.status, text: readFileSync(scheduleFile, "utf8") }).toEqual({
        exitCode: 0,
        text: swappedText,
      });
    },
  );
});
