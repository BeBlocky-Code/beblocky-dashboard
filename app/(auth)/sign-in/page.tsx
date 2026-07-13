"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { buildAuthRedirectUrl, resolveAppCallbackUrl } from "@/lib/auth-callback";

const AUTH_APP_URL =
  process.env.NEXT_PUBLIC_AUTH_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://auth.beblocky.com"
    : "http://localhost:3000");

function SignInRedirect() {
  const searchParams = useSearchParams();
  const callbackPath = searchParams.get("callbackUrl") ?? "/courses";
  useEffect(() => {
    const callbackUrl = resolveAppCallbackUrl(callbackPath);
    window.location.href = buildAuthRedirectUrl(
      AUTH_APP_URL,
      callbackUrl,
      "dashboard"
    );
  }, [callbackPath]);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-muted-foreground">Redirecting to sign in…</p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SignInRedirect />
    </Suspense>
  );
}
