import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "ovora_session";
const SECRET =
  process.env.AUTH_SECRET ??
  "ovora-dev-secret-change-me-in-production-0123456789abcdef";

export interface AuthClaims {
  uid: number;
  name: string;
  email: string;
  role: "Pemilik" | "Manager" | "Kasir";
  branch: string | null;
  exp: number;
}

function b64urlEncode(data: string): string {
  return Buffer.from(data, "utf8").toString("base64url");
}

function b64urlDecode(data: string): string {
  return Buffer.from(data, "base64url").toString("utf8");
}

export function signToken(payload: Omit<AuthClaims, "exp">, ttlMs = 12 * 60 * 60 * 1000): string {
  const exp = Date.now() + ttlMs;
  const body = b64urlEncode(JSON.stringify({ ...payload, exp }));
  const sig = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyToken(token: string | undefined | null): AuthClaims | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const claims = JSON.parse(b64urlDecode(body)) as AuthClaims;
    if (typeof claims.exp !== "number" || claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export function makeTokenPair(payload: Omit<AuthClaims, "exp">, ttlMs?: number): string {
  return signToken(payload, ttlMs);
}
