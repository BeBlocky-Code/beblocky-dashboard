export const PRODUCTION_CLIENT_APP_URL = "https://code.beblocky.com";
export const PRODUCTION_DASHBOARD_APP_URL = "https://dashboard.beblocky.com";
export const PRODUCTION_AUTH_APP_URL = "https://auth.beblocky.com";
export const PRODUCTION_AUTH_SERVICE_URL = "https://auth-service.beblocky.com";

export const DEV_CLIENT_APP_URL = "http://localhost:3002";
export const DEV_DASHBOARD_APP_URL = "http://localhost:3003";
export const DEV_AUTH_APP_URL = "http://localhost:3000";
export const DEV_AUTH_SERVICE_URL = "http://localhost:8080";

export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "[::1]"
  );
}

export function isLoopbackUrl(raw: string): boolean {
  try {
    return isLoopbackHostname(new URL(raw).hostname);
  } catch {
    return false;
  }
}

/**
 * Prefer the env value. In production, never return a loopback URL — even if
 * the env var is unset or still points at localhost from a local .env.
 */
export function resolvePublicAppUrl(options: {
  fromEnv?: string | undefined;
  productionUrl: string;
  developmentUrl: string;
  nodeEnv?: string | undefined;
}): string {
  const nodeEnv = options.nodeEnv ?? process.env.NODE_ENV;
  const trimmed = options.fromEnv?.trim().replace(/\/$/, "") ?? "";
  if (nodeEnv === "production") {
    if (trimmed && !isLoopbackUrl(trimmed)) {
      return trimmed;
    }
    return options.productionUrl.replace(/\/$/, "");
  }
  return (trimmed || options.developmentUrl).replace(/\/$/, "");
}

/** This dashboard origin (callback target after auth). */
export function dashboardAppUrl(): string {
  return resolvePublicAppUrl({
    fromEnv: process.env.NEXT_PUBLIC_APP_URL,
    productionUrl: PRODUCTION_DASHBOARD_APP_URL,
    developmentUrl: DEV_DASHBOARD_APP_URL,
  });
}

export function clientAppUrl(): string {
  return resolvePublicAppUrl({
    fromEnv: process.env.NEXT_PUBLIC_CLIENT_APP_URL,
    productionUrl: PRODUCTION_CLIENT_APP_URL,
    developmentUrl: DEV_CLIENT_APP_URL,
  });
}

export function authAppUrl(): string {
  return resolvePublicAppUrl({
    fromEnv: process.env.NEXT_PUBLIC_AUTH_APP_URL,
    productionUrl: PRODUCTION_AUTH_APP_URL,
    developmentUrl: DEV_AUTH_APP_URL,
  });
}

export function authServiceUrl(): string {
  return resolvePublicAppUrl({
    fromEnv: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
    productionUrl: PRODUCTION_AUTH_SERVICE_URL,
    developmentUrl: DEV_AUTH_SERVICE_URL,
  });
}

/**
 * Origin for auth-service calls made by the Next.js server (proxy, route
 * handlers, server layouts). Prefers AUTH_SERVICE_INTERNAL_URL, the Docker
 * address, and falls back to the public URL.
 *
 * Browser code must keep using authServiceUrl(). An internal hostname in a
 * NEXT_PUBLIC_ var is inlined into the client bundle and breaks login.
 * The internal var is read with a computed key so the production image can
 * receive it at container start; NEXT_PUBLIC_ values are frozen at build.
 */
export function authServiceServerUrl(): string {
  if (typeof window !== "undefined") return authServiceUrl();
  const internal = process.env["AUTH_SERVICE_INTERNAL_URL"]?.trim();
  if (internal) return internal.replace(/\/$/, "");
  return authServiceUrl();
}
