import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildAuthRedirectUrl, buildCallbackUrl } from "@/lib/auth-callback";

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

  // After OAuth, auth-service redirects here with ?token=...; set session cookie and redirect to clean URL.
  const token = request.nextUrl.searchParams.get("token");
  if (token) {
    const target = new URL(request.url);
    target.searchParams.delete("token");
    target.searchParams.delete("callbackUrl");
    target.searchParams.delete("origin");
    const res = NextResponse.redirect(target);
    const isSecure = request.url.startsWith("https");
    res.cookies.set("session", token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
      maxAge: 7 * 24 * 3600,
      path: "/",
    });
    return res;
  }

  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  const sessionToken =
    request.cookies.get("session")?.value ||
    request.cookies.get("__Secure-session")?.value ||
    request.cookies.get("__Host-session")?.value;

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
      const cookieHeader = request.headers.get("cookie") ?? "";
      const res = await fetch(`${base}/api/v1/account/complete`, {
        headers: { Cookie: cookieHeader },
      });
      if (res.status === 401) {
        const callbackUrl = buildCallbackUrl(request, AUTH_APP_URL);
        return NextResponse.redirect(
          buildAuthRedirectUrl(AUTH_APP_URL, callbackUrl, "dashboard")
        );
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
