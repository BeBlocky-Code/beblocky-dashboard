import type { NextRequest } from "next/server";

const AUTH_QUERY_PARAMS = ["callbackUrl", "origin", "token"] as const;

const DEFAULT_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

function stripAuthQueryParams(url: URL): void {
  for (const key of AUTH_QUERY_PARAMS) {
    url.searchParams.delete(key);
  }
}

export function unwrapCallbackUrl(raw: string): string {
  let current = raw;
  for (let depth = 0; depth < 16; depth++) {
    try {
      const url = new URL(
        current.startsWith("http") ? current : `http://local${current.startsWith("/") ? current : `/${current}`}`
      );
      const nested = url.searchParams.get("callbackUrl");
      if (nested) {
        current = nested;
        continue;
      }
      stripAuthQueryParams(url);
      const qs = url.searchParams.toString();
      return `${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function buildCallbackUrl(
  request: NextRequest,
  authAppUrl: string
): string {
  const authOrigin = new URL(authAppUrl).origin;
  const appBase = DEFAULT_DASHBOARD_URL.replace(/\/$/, "");

  const existing = request.nextUrl.searchParams.get("callbackUrl");
  if (existing) {
    const unwrapped = unwrapCallbackUrl(existing);
    try {
      const url = new URL(unwrapped);
      if (url.origin !== authOrigin) {
        stripAuthQueryParams(url);
        const qs = url.searchParams.toString();
        return `${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
      }
    } catch {
      // fall through
    }
  }

  const params = new URLSearchParams(request.nextUrl.search);
  for (const key of AUTH_QUERY_PARAMS) {
    params.delete(key);
  }
  const qs = params.toString();
  const path = request.nextUrl.pathname + (qs ? `?${qs}` : "");
  const callback =
    path === "/" && !qs
      ? `${appBase}/courses`
      : `${appBase}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const url = new URL(callback);
    if (url.origin === authOrigin) {
      return `${appBase}/courses`;
    }
  } catch {
    return `${appBase}/courses`;
  }

  return callback;
}

export function buildAuthRedirectUrl(
  authAppUrl: string,
  callbackUrl: string,
  origin: string
): string {
  const base = authAppUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    callbackUrl,
    origin,
  });
  return `${base}?${params.toString()}`;
}

/** Resolve a path or URL to the dashboard app callback (client-side sign-in pages). */
export function resolveAppCallbackUrl(callbackPath: string): string {
  const appBase = DEFAULT_DASHBOARD_URL.replace(/\/$/, "");
  const authOrigin = (() => {
    try {
      return new URL(
        process.env.NEXT_PUBLIC_AUTH_APP_URL ?? "http://localhost:3000"
      ).origin;
    } catch {
      return "http://localhost:3000";
    }
  })();

  if (callbackPath.startsWith("http://") || callbackPath.startsWith("https://")) {
    const unwrapped = unwrapCallbackUrl(callbackPath);
    try {
      const url = new URL(unwrapped);
      if (url.origin === authOrigin) {
        return `${appBase}/courses`;
      }
      stripAuthQueryParams(url);
      const qs = url.searchParams.toString();
      return `${url.origin}${url.pathname}${qs ? `?${qs}` : ""}`;
    } catch {
      return `${appBase}/courses`;
    }
  }

  const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
  return `${appBase}${path}`;
}
