import { RequestBuilder, type RequestFnParams } from "@dune2/tools/rq";
import { env } from "@/lib/env";
import { queryClient } from "@/lib/query-client";
import { clearAuth, getAuthUser } from "@/lib/auth";
import {
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_UNAUTHORIZED,
} from "@/constants/http";

function buildQuery(params: unknown): string {
  if (!params || typeof params !== "object") {
    return "";
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function requestFn<T>({
  url = "",
  method = "get",
  params,
  data,
  headers,
  signal,
}: RequestFnParams): Promise<T> {
  const token = getAuthUser()?.token;

  const response = await fetch(
    `${env.VITE_API_BASE_URL}${url}${buildQuery(params)}`,
    {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body:
        data === undefined || data === null ? undefined : JSON.stringify(data),
      signal,
    }
  );

  if (!response.ok) {
    if (response.status === HTTP_STATUS_UNAUTHORIZED) {
      clearAuth();
    }
    const message = await response.text();
    throw new Error(message || `${response.status} ${response.statusText}`);
  }

  if (response.status === HTTP_STATUS_NO_CONTENT) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// Global interceptor: base URL, auth header, JSON handling, unified errors.
RequestBuilder.setRequestFn(requestFn);
// Reuse the app's QueryClient so devtools and invalidation stay in sync.
RequestBuilder.setQueryClientFactory(() => queryClient);

export { requestFn };
