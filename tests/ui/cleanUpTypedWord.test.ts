import { describe, expect, it } from "vitest";
import { cleanUpTypedWord } from "../../src/ui/cleanUpTypedWord";

// Chunk 3.2, carried forward from 1.5 review 6: invisible characters pasted
// or typed into a word made checkMove report it as the wrong length.
describe("cleanUpTypedWord", () => {
  it("removes a zero-width space inside a word", () => {
    // Arrange
    const typedWord = "co​rd";

    // Act
    const result = cleanUpTypedWord(typedWord);

    // Assert
    expect(result).toBe("cord");
  });

  it("removes a byte order mark before a word", () => {
    // Arrange
    const typedWord = "﻿cord";

    // Act
    const result = cleanUpTypedWord(typedWord);

    // Assert
    expect(result).toBe("cord");
  });

  it("removes a soft hyphen inside a word", () => {
    // Arrange
    const typedWord = "co­rd";

    // Act
    const result = cleanUpTypedWord(typedWord);

    // Assert
    expect(result).toBe("cord");
  });
});
