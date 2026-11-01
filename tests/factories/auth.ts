import { type AuthUser } from "@/lib/auth";

export function makeAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    username: "admin",
    role: "admin",
    token: "test-token",
    ...overrides,
  };
}
