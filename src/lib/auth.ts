import { AUTH_KEY } from "@/constants/auth";
import { LOGIN_DELAY_MS } from "@/constants/timing";

export interface AuthUser {
  username: string;
  role: string;
  token: string;
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

/**
 * Mock login API — replace with real API call
 */
export async function loginApi(
  username: string,
  password: string
): Promise<AuthUser> {
  await new Promise((resolve) => {
    setTimeout(resolve, LOGIN_DELAY_MS);
  });

  if (username === "admin" && password === "123456") {
    return {
      username: "admin",
      role: "admin",
      token: `mock-token-${Date.now()}`,
    };
  }

  throw new Error("Invalid username or password");
}
