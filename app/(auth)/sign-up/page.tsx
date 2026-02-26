"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const AUTH_APP_URL =
  process.env.NEXT_PUBLIC_AUTH_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://auth.beblocky.com"
    : "http://localhost:3000");
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

function getFullCallbackUrl(callbackPath: string): string {
  if (callbackPath.startsWith("http://") || callbackPath.startsWith("https://")) {
    return callbackPath;
  }
  const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
  if (APP_URL) {
    return `${APP_URL.replace(/\/$/, "")}${path}`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}${path}`;
  }
  return path;
}

function SignUpRedirect() {
  const searchParams = useSearchParams();
  const callbackPath = searchParams.get("callbackUrl") ?? "/courses";
  useEffect(() => {
    const callbackUrl = getFullCallbackUrl(callbackPath);
    const base = AUTH_APP_URL.replace(/\/$/, "");
    window.location.href = `${base}?callbackUrl=${encodeURIComponent(callbackUrl)}&origin=dashboard`;
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
