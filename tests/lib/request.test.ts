import { afterEach, describe, expect, it, vi } from "vitest";
import { getAuthUser, setAuthUser } from "@/lib/auth";
import { requestFn } from "@/lib/request";
import { makeAuthUser } from "../factories/auth";

function fakeResponse(
  body: string,
  { ok, status, statusText = "" }: { ok: boolean; status: number; statusText?: string }
): Response {
  return {
    ok,
    status,
    statusText,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("requestFn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefixes the base URL and serializes query params", async () => {
    const fetchMock = vi.fn(() =>
      fakeResponse(JSON.stringify({ ok: true }), { ok: true, status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestFn({ url: "/users", method: "get", params: { page: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users?page=1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("throws the response body on a non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fakeResponse("boom", { ok: false, status: 500 }))
    );

    await expect(requestFn({ url: "/users", method: "get" })).rejects.toThrow(
      "boom"
    );
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fakeResponse("", { ok: true, status: 204 }))
    );

    await expect(requestFn({ url: "/users", method: "delete" })).resolves.toBeUndefined();
  });

  it("adds the bearer token from the current session", async () => {
    setAuthUser(makeAuthUser({ token: "session-token" }));
    const fetchMock = vi.fn(() =>
      fakeResponse(JSON.stringify({ ok: true }), { ok: true, status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestFn({ url: "/me", method: "get" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
      })
    );
  });

  it("omits undefined and null query params", async () => {
    const fetchMock = vi.fn(() =>
      fakeResponse(JSON.stringify({ ok: true }), { ok: true, status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    await requestFn({
      url: "/users",
      method: "get",
      params: { page: 1, missing: undefined, empty: null },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/users?page=1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("clears the session on 401 responses", async () => {
    setAuthUser(makeAuthUser({ token: "expired-token" }));
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fakeResponse("unauthorized", { ok: false, status: 401 }))
    );

    await expect(requestFn({ url: "/me", method: "get" })).rejects.toThrow(
      "unauthorized"
    );
    expect(getAuthUser()).toBeNull();
  });
});
