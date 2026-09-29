"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { clearClientCaches } from "@/lib/query-client";
import { CLIENT_APP_URL, primaryRoleLabel } from "@/lib/workspace";
import logo from "@/lib/images/logo.png";

export function WrongWorkspace({ roles }: { roles: string[] }) {
  const role = primaryRoleLabel(roles);
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    clearClientCaches(queryClient);
    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as {
        redirectUrl?: string;
      };
      window.location.href = json?.redirectUrl ?? "/sign-in";
    } catch {
      window.location.href = "/sign-in";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Image src={logo} alt="BeBlocky" width={160} height={44} className="h-10 w-auto" />
      <h1 className="mt-8 text-2xl font-bold tracking-tight">
        This dashboard is for schools
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">
        You signed in as a {role}. Continue in BeBlocky to take Courses and set
        Goals.
      </p>
      <Button className="mt-6" asChild>
        <a href={CLIENT_APP_URL}>Open BeBlocky</a>
      </Button>
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
