import type { AuthClaims } from "@/lib/auth-token";
import { signToken, verifyToken } from "@/lib/auth-token";

export const SESSION_COOKIE = "ovora_session";
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function createSessionToken(claims: Omit<AuthClaims, "exp">): string {
  return signToken(claims, SESSION_TTL_MS);
}

export function getSessionUser(token: string | undefined | null): AuthClaims | null {
  return verifyToken(token);
}

export function destroySession(_token: string | undefined | null): void {
  // Stateless: membersihkan cukup dengan menghapus cookie pada sisi klien.
}
