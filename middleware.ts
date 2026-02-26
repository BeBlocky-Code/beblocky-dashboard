import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_APP_URL =
  process.env.NEXT_PUBLIC_AUTH_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://auth.beblocky.com"
    : "http://localhost:3000");
const AUTH_SERVICE_URL =
  process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://auth-service.beblocky.com"
    : "http://localhost:8080");
/** Production app URL for callback after auth (e.g. https://admin.beblocky.com). If set, used instead of request.url. */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const publicPaths = ["/sign-in", "/sign-up"];

function getCallbackUrl(request: NextRequest): string {
  if (APP_URL) {
    const base = APP_URL.replace(/\/$/, "");
    const path = request.nextUrl.pathname + request.nextUrl.search;
    return path ? `${base}${path.startsWith("/") ? path : `/${path}`}` : base + "/";
  }
  return request.url;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  const sessionToken =
    request.cookies.get("session")?.value ||
    request.cookies.get("__Secure-session")?.value ||
    request.cookies.get("__Host-session")?.value;

  if (!sessionToken && !isPublicPath) {
    const callbackUrl = getCallbackUrl(request);
    const authUrl = `${AUTH_APP_URL.replace(/\/$/, "")}?callbackUrl=${encodeURIComponent(callbackUrl)}&origin=dashboard`;
    return NextResponse.redirect(authUrl);
  }

  if (sessionToken && isPublicPath) {
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  if (sessionToken && !isPublicPath) {
    try {
      const base = AUTH_SERVICE_URL.replace(/\/$/, "");
      const cookieHeader = request.headers.get("cookie") ?? "";
      const res = await fetch(`${base}/api/v1/account/complete`, {
        headers: { Cookie: cookieHeader },
      });
      if (res.status === 401) {
        const callbackUrl = getCallbackUrl(request);
        const authUrl = `${AUTH_APP_URL.replace(/\/$/, "")}?callbackUrl=${encodeURIComponent(callbackUrl)}&origin=dashboard`;
        return NextResponse.redirect(authUrl);
      }
      if (res.status === 200) {
        const data = (await res.json()) as { complete?: boolean };
        if (data.complete === false) {
          const callbackUrl = getCallbackUrl(request);
          const onboardingUrl = `${AUTH_APP_URL.replace(/\/$/, "")}/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}&origin=dashboard`;
          return NextResponse.redirect(onboardingUrl);
        }
      }
    } catch {
      // Allow through if auth-service is unreachable to avoid locking users out
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
