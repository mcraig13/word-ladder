import { describe, expect, it } from "vitest";
import { createScheduleFromText } from "../../src/puzzles/createScheduleFromText";
import committedScheduleText from "../../data/puzzles/schedule.txt?raw";

// Chunk 2.6b. The schedule file as 2.6a writes it: line N is puzzle #N, as
// start, target and the shortest path's moves, lowercase, one space apart,
// with LF after each line. Anything else is a hand edit gone wrong, so it's
// rejected with its line number rather than guessed at (2.6b intent).

describe("createScheduleFromText", () => {
  it("reads each line as a puzzle, in order", () => {
    // Arrange
    // Two-digit moves read as one number. Whether the moves are right is
    // 2.6c's check, not the reader's.
    const text = "cold warm 4\ncord ward 12\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({
      ok: true,
      schedule: [
        { start: "cold", target: "warm", shortestPathMoves: 4 },
        { start: "cord", target: "ward", shortestPathMoves: 12 },
      ],
    });
  });

  it("reads an empty file as an empty schedule", () => {
    // Arrange
    const text = "";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: true, schedule: [] });
  });

  it("rejects a line with a capital letter, giving its line number", () => {
    // Arrange
    // Read as given, Cord would slip past the repeat window (2.6a A2, B4).
    const text = "cold warm 4\nCord ward 2\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("rejects a line with a part missing", () => {
    // Arrange
    const text = "cold warm 4\ncord ward\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("rejects a line with an extra part", () => {
    // Arrange
    const text = "cold warm 4 card\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects moves of zero", () => {
    // Arrange
    // A start and target are different words, so at least one move apart.
    const text = "cold warm 4\ncord ward 0\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("rejects negative moves", () => {
    // Arrange
    const text = "cold warm -4\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects moves that aren't a whole number", () => {
    // Arrange
    const text = "cold warm 4.5\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects moves with a leading zero", () => {
    // Arrange
    // Read as 4, it would be written back as "cold warm 4", not as it was (D24).
    const text = "cold warm 04\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects parts not separated by a single space", () => {
    // Arrange
    // Read, it would be written back with one space, not as it was (D24).
    const text = "cold  warm 4\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects a blank line", () => {
    // Arrange
    const text = "cold warm 4\n\ncord ward 2\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("rejects a Windows line ending", () => {
    // Arrange
    const text = "cold warm 4\r\n";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("rejects a last line with no newline", () => {
    // Arrange
    // Lines added after it would join on to it.
    const text = "cold warm 4\ncord ward 2";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 2 });
  });

  it("reports the first unreadable line when the last line has no newline too", () => {
    // Arrange
    const text = "Cold warm 4\ncord ward 2";

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result).toEqual({ ok: false, reason: "unreadable-line", lineNumber: 1 });
  });

  it("reads the committed schedule file back", () => {
    // Arrange
    const text = committedScheduleText;

    // Act
    const result = createScheduleFromText(text);

    // Assert
    expect(result.ok).toBe(true);
  });
});
