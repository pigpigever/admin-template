import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAuth,
  getAuthUser,
  isAuthenticated,
  setAuthUser,
} from "@/lib/auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reports unauthenticated when nothing is stored", () => {
    expect(getAuthUser()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("stores and reads the current user", () => {
    const user = { username: "admin", role: "admin", token: "t" };
    setAuthUser(user);
    expect(getAuthUser()).toEqual(user);
    expect(isAuthenticated()).toBe(true);
  });

  it("clears the session", () => {
    setAuthUser({ username: "admin", role: "admin", token: "t" });
    clearAuth();
    expect(isAuthenticated()).toBe(false);
  });

  it("tolerates corrupt storage", () => {
    localStorage.setItem("admin-template-auth", "{not json");
    expect(getAuthUser()).toBeNull();
  });
});
