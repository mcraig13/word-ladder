// Setup for the jsdom UI tests (D33). Vitest globals are off, so Testing
// Library can't register its own cleanup; this does it after each test.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
