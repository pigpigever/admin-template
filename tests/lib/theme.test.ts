import { describe, expect, it } from "vitest";
import { cssVar } from "@/lib/theme";

describe("cssVar", () => {
  it("reads a CSS custom property from the document root", () => {
    document.documentElement.style.setProperty("--test-color", "red");
    expect(cssVar("--test-color", "blue")).toBe("red");
  });

  it("falls back when the property is not defined", () => {
    expect(cssVar("--not-defined", "blue")).toBe("blue");
  });
});
