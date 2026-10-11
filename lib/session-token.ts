/**
 * Helpers for binding short-lived proxy cookies to a session token.
 *
 * These run in both the Next.js Edge runtime (Web Crypto) and Node tests,
 * so they only use crypto.subtle / TextEncoder and no Node-only modules.
 */

export const ACCT_OK_COOKIE_NAME = "acct_ok";

function base64url(bytes: Uint8Array): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let result = "";
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i]!;
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    i += 3;
    const bitmap = (b1 << 16) | ((b2 ?? 0) << 8) | (b3 ?? 0);
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += b2 !== undefined ? chars.charAt((bitmap >> 6) & 63) : "";
    result += b3 !== undefined ? chars.charAt(bitmap & 63) : "";
  }
  return result;
}

/** Return a short base64url SHA-256 hash of the token (first 16 bytes). */
export async function hashSessionToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(token),
  );
  return base64url(new Uint8Array(digest.slice(0, 16)));
}

/**
 * True when the request is an App Router RSC navigation.
 *
 * `rsc: 1` is sent for RSC fetches; `next-router-state-tree` is sent for both
 * RSC fetches and prefetches. We treat either as a soft navigation.
 */
export function isRscNavigationRequest(
  headerGet: (name: string) => string | null,
): boolean {
  if (headerGet("rsc") === "1") return true;
  if (headerGet("next-router-state-tree")) return true;
  return false;
}

/** Build a Set-Cookie header for the account-ok short-lived marker. */
export function buildAcctOkCookieHeader(
  tokenHash: string,
  options?: { secure?: boolean; maxAge?: number },
): string {
  const maxAge = options?.maxAge ?? 300;
  const parts = [
    `${ACCT_OK_COOKIE_NAME}=${tokenHash}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (options?.secure) parts.push("Secure");
  return parts.join("; ");
}

/** Build a Set-Cookie header that clears the account-ok marker. */
export function buildClearAcctOkCookieHeader(): string {
  return `${ACCT_OK_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

/** True when the acct_ok cookie value matches the current token's hash. */
export async function isAcctOkForToken(
  token: string,
  cookieValue: string | undefined,
): Promise<boolean> {
  if (!cookieValue) return false;
  return (await hashSessionToken(token)) === cookieValue;
}
