import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildAuthRedirectUrl,
  buildCallbackUrl,
  buildSessionCookieHeader,
  normalizeSessionToken,
} from "@/lib/auth-callback";

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

const publicPaths = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const rawToken = request.nextUrl.searchParams.get("token");
  const handoffToken = normalizeSessionToken(rawToken);
  if (handoffToken) {
    const target = new URL(request.url);
    target.searchParams.delete("token");
    target.searchParams.delete("callbackUrl");
    target.searchParams.delete("origin");
    const res = NextResponse.redirect(target);
    const isSecure = request.url.startsWith("https");
    res.headers.append(
      "Set-Cookie",
      buildSessionCookieHeader(handoffToken, { secure: isSecure })
    );
    return res;
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  const sessionToken = normalizeSessionToken(
    request.cookies.get("session")?.value ||
      request.cookies.get("__Secure-session")?.value ||
      request.cookies.get("__Host-session")?.value
  );

  if (!sessionToken && !isPublicPath) {
    const callbackUrl = buildCallbackUrl(request, AUTH_APP_URL);
    return NextResponse.redirect(
      buildAuthRedirectUrl(AUTH_APP_URL, callbackUrl, "dashboard")
    );
  }

  if (sessionToken && isPublicPath) {
    return NextResponse.redirect(new URL("/courses", request.url));
  }

  if (sessionToken && !isPublicPath) {
    try {
      const base = AUTH_SERVICE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/v1/account/complete`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          Cookie: `session=${sessionToken}`,
        },
        cache: "no-store",
      });
      if (res.status === 401) {
        const callbackUrl = buildCallbackUrl(request, AUTH_APP_URL);
        const redirectRes = NextResponse.redirect(
          buildAuthRedirectUrl(AUTH_APP_URL, callbackUrl, "dashboard")
        );
        redirectRes.headers.append(
          "Set-Cookie",
          "session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
        );
        return redirectRes;
      }
      if (res.status === 200) {
        const data = (await res.json()) as { complete?: boolean };
        if (data.complete === false) {
          const callbackUrl = buildCallbackUrl(request, AUTH_APP_URL);
          const onboardingUrl = `${AUTH_APP_URL.replace(/\/$/, "")}/onboarding?${new URLSearchParams({ callbackUrl, origin: "dashboard" }).toString()}`;
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
