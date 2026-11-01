import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOGIN_DELAY_MS } from "@/constants/timing";
import {
  clearAuth,
  getAuthUser,
  isAuthenticated,
  loginApi,
  setAuthUser,
} from "@/lib/auth";

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it("logs in with valid credentials after the configured delay", async () => {
    vi.useFakeTimers();
    const pending = loginApi("admin", "123456");

    await vi.advanceTimersByTimeAsync(LOGIN_DELAY_MS);
    await expect(pending).resolves.toMatchObject({
      username: "admin",
      role: "admin",
      token: expect.any(String),
    });
  });

  it("rejects invalid credentials after the configured delay", async () => {
    vi.useFakeTimers();
    const pendingError = (async () => {
      try {
        await loginApi("admin", "wrong");
        return null;
      } catch (error) {
        return error;
      }
    })();

    await vi.advanceTimersByTimeAsync(LOGIN_DELAY_MS);
    await expect(pendingError).resolves.toMatchObject({
      message: "Invalid username or password",
    });
  });
});
