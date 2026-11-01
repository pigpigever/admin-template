import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

describe("parseEnv", () => {
  it("uses defaults when values are missing", () => {
    expect(parseEnv({})).toEqual({
      VITE_APP_TITLE: "Admin Template",
      VITE_API_BASE_URL: "/api",
    });
  });

  it("accepts valid overrides", () => {
    expect(
      parseEnv({
        VITE_APP_TITLE: "Admin Console",
        VITE_API_BASE_URL: "/v1",
      })
    ).toEqual({
      VITE_APP_TITLE: "Admin Console",
      VITE_API_BASE_URL: "/v1",
    });
  });

  it("rejects empty required values", () => {
    expect(() => parseEnv({ VITE_APP_TITLE: "" })).toThrow();
    expect(() => parseEnv({ VITE_API_BASE_URL: "" })).toThrow();
  });

  it("strips unknown keys", () => {
    expect(parseEnv({ VITE_API_BASE_URL: "/api", UNKNOWN: "ignored" })).toEqual({
      VITE_APP_TITLE: "Admin Template",
      VITE_API_BASE_URL: "/api",
    });
  });
});
