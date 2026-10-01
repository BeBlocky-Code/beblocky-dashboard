"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { buildAuthRedirectUrl, resolveAppCallbackUrl } from "@/lib/auth-callback";
import { authAppUrl } from "@/lib/app-urls";

const AUTH_APP_URL = authAppUrl();

function SignUpRedirect() {
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
      <p className="text-muted-foreground">Redirecting to sign up…</p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <SignUpRedirect />
    </Suspense>
  );
}
