import { describe, expect, it } from "vitest";
import { createDictionaryFromWords } from "../../src/core/createDictionaryFromWords";
import { checkSchedule } from "../../src/puzzles/checkSchedule";
import { createScheduleFromText } from "../../src/puzzles/createScheduleFromText";
import acceptedText from "../../data/words/accepted.txt?raw";
import puzzleText from "../../data/words/puzzle.txt?raw";
import committedScheduleText from "../../data/puzzles/schedule.txt?raw";

// Chunk 2.6c. The committed schedule still passes the build checks with the
// committed word lists, so a list change that breaks a scheduled puzzle fails
// CI even if nobody runs build:schedule (D24).

// One shortest-path search per puzzle took about 25 s for 365 puzzles before
// 2.6c sped up the neighbour lookup, and about 2 s after; the timeout leaves room.
const WHOLE_SCHEDULE_TIMEOUT_MILLISECONDS = 60_000;

describe("checkSchedule on the committed files", () => {
  it(
    "the committed schedule passes the checks with the committed word lists",
    { timeout: WHOLE_SCHEDULE_TIMEOUT_MILLISECONDS },
    () => {
      // Arrange
      const readResult = createScheduleFromText(committedScheduleText);
      const schedule = readResult.ok ? readResult.schedule : [];
      const options = {
        acceptedWords: createDictionaryFromWords(acceptedText.split("\n")),
        puzzleWords: createDictionaryFromWords(puzzleText.split("\n")),
        // D30.
        daysBeforeWordRepeats: 90,
        // Before launch today is #0; 3.8 works it out from the date here too.
        todaysPuzzleNumber: 0,
        // D24.
        fewestPuzzlesAhead: 60,
      };

      // Act
      const result = checkSchedule(schedule, options);

      // Assert
      expect(result).toEqual({ ok: true });
    },
  );
});
