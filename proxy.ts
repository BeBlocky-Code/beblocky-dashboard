import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildAuthRedirectUrl,
  buildCallbackUrl,
  buildSessionCookieHeader,
  normalizeSessionToken,
} from "@/lib/auth-callback";
import { authAppUrl } from "@/lib/app-urls";
import { isPrefetchRequest } from "@/lib/prefetch-request";
import { fetchAuthService } from "@/lib/server/same-host-fetch";
import {
  buildAcctOkCookieHeader,
  buildClearAcctOkCookieHeader,
  hashSessionToken,
  isAcctOkForToken,
  isRscNavigationRequest,
} from "@/lib/session-token";

const AUTH_APP_URL = authAppUrl();

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

    // After login, never dump the user on the app root; send them straight
    // to the courses page. Deep links (e.g. /classes?foo=bar) are preserved.
    if (target.pathname === "/") {
      target.pathname = "/courses";
      target.search = "";
    }

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

  // Next strips `next-router-prefetch` before proxy runs, so App Router
  // prefetches are stopped with prefetch={false} on sidebar links. Browser
  // prefetches that still send purpose / sec-purpose skip the session check.
  // Cookie absence still redirects above.
  if (
    sessionToken &&
    !isPublicPath &&
    !isPrefetchRequest((name) => request.headers.get(name))
  ) {
    const headerGet = (name: string) => request.headers.get(name);
    const acctOkCookie = request.cookies.get("acct_ok")?.value;
    const canSkipAccountCheck =
      (await isAcctOkForToken(sessionToken, acctOkCookie)) ||
      isRscNavigationRequest(headerGet);

    if (!canSkipAccountCheck) {
      try {
        const res = await fetchAuthService("/api/v1/account/complete", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            Cookie: `session=${sessionToken}`,
          },
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
          redirectRes.headers.append(
            "Set-Cookie",
            buildClearAcctOkCookieHeader()
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
          const isSecure = request.url.startsWith("https");
          const tokenHash = await hashSessionToken(sessionToken);
          const nextRes = NextResponse.next();
          nextRes.headers.append(
            "Set-Cookie",
            buildAcctOkCookieHeader(tokenHash, { secure: isSecure })
          );
          return nextRes;
        }
      } catch {
        // Allow through if auth-service is unreachable to avoid locking users out
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
