import { authServiceServerUrl } from "@/lib/app-urls";

/** Bound for server-side auth-service calls. A hung public URL must not stall the page. */
export const AUTH_SERVICE_TIMEOUT_MS = 1500;

/**
 * Fetch auth-service from the Next.js server.
 *
 * Uses AUTH_SERVICE_INTERNAL_URL (Docker network, for example http://auth-api:8080)
 * and falls back to the public URL. The internal address is read at request time
 * so it can be set on the running container without a rebuild. NEXT_PUBLIC_*
 * values are inlined at build time and do need a rebuild.
 *
 * Do not call this from client components. The browser must keep using
 * NEXT_PUBLIC_AUTH_SERVICE_URL via authServiceUrl().
 */
export function fetchAuthService(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = authServiceServerUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const timeout = AbortSignal.timeout(AUTH_SERVICE_TIMEOUT_MS);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(url, {
    ...init,
    cache: "no-store",
    signal,
  });
}
