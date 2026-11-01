import { afterEach, describe, expect, it, vi } from "vitest";
import { requestFn } from "@/lib/request";

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
});
