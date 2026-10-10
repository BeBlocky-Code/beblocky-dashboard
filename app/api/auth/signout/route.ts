import { NextRequest, NextResponse } from "next/server";
import { authAppUrl } from "@/lib/app-urls";
import { fetchAuthService } from "@/lib/server/same-host-fetch";

const AUTH_APP_URL = authAppUrl();

function getIsSecure(request: NextRequest) {
  // NextRequest.nextUrl.protocol is usually enough, but fall back to forwarded proto.
  const proto = request.nextUrl.protocol;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return proto === "https" || forwardedProto === "https";
}

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  // 1) Revoke the server-side session at the auth service.
  try {
    // Forward the app-domain cookie header so auth-api can find `session`.
    // auth-api reads `r.Cookie("session")`, so only the cookie name matters.
    await fetchAuthService("/api/v1/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
  } catch (error) {
    // We still clear local cookies below, so users can’t get stuck.
    console.error("[signout] auth-service logout failed:", error);
  }

  // 2) Clear the app-domain session cookie (httpOnly can't be cleared client-side).
  const res = NextResponse.json(
    { redirectUrl: AUTH_APP_URL.replace(/\/$/, "") },
    { status: 200 }
  );

  const isSecure = getIsSecure(request);
  res.cookies.set("session", "", {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  // Back-compat: middleware also reads these cookie names if they exist.
  res.cookies.set("__Secure-session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  res.cookies.set("__Host-session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

