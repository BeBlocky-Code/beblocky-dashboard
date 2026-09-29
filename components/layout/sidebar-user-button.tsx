"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { clearClientCaches } from "@/lib/query-client";
import { primaryRoleLabel } from "@/lib/workspace";

export function SidebarUserButton({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, isPending } = useSession();
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

  if (isPending) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const user = session?.user;
  if (!user) {
    return (
      <div className="p-4">
        <div className="text-sm text-muted-foreground">Please sign in</div>
      </div>
    );
  }

  const roleLabel = primaryRoleLabel(user.roles ?? []);
  const initials =
    (user.name ?? "")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() || (user.email?.[0] ?? "?").toUpperCase();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.button
          type="button"
          className={cn(
            "w-full text-left hover:bg-accent/50 transition-colors duration-200 cursor-pointer",
            isCollapsed ? "p-2" : "p-4",
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              isCollapsed && "justify-center",
            )}
          >
            <Avatar className="h-12 w-12 ring-2 ring-primary/20 hover:ring-primary/30 transition-all duration-200">
              <AvatarImage src={user.image || undefined} alt="" />
              <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {user.name || "Account"}
                </p>
                <Label className="text-xs capitalize text-muted-foreground">
                  {roleLabel}
                </Label>
              </div>
            )}
          </div>
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 p-2"
        align="end"
        side="top"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user.image || undefined} alt="" />
              <AvatarFallback className="bg-primary text-base text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user.name || "Account"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2 text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
