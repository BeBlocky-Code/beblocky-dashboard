"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const AUTH_APP_URL = process.env.NEXT_PUBLIC_AUTH_APP_URL ?? "http://localhost:3000";

function SignUpRedirect() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/courses";
  useEffect(() => {
    const base = AUTH_APP_URL.replace(/\/$/, "");
    window.location.href = `${base}?callbackUrl=${encodeURIComponent(callbackUrl)}&origin=dashboard&mode=signup`;
  }, [callbackUrl]);
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
