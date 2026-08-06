"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  Package,
  Sun,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useThemeContext } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import logo from "@/lib/images/logo.png";
import iconLogo from "@/lib/images/icon-logo.png";

const SIDEBAR_COLLAPSED_KEY = "beblocky-dashboard-sidebar-collapsed";

const navItems = [
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/bundles", label: "Bundles", icon: Package },
  { href: "/classes", label: "Classes", icon: Users },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function SidebarChrome({
  collapsed,
  onToggleCollapsed,
  showCollapseControl,
}: {
  collapsed: boolean;
  onToggleCollapsed?: () => void;
  showCollapseControl?: boolean;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeContext();
  const { user, isLoading } = useAuth();

  const handleSignOut = async () => {
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/60 bg-card transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border/60 px-3",
          collapsed ? "justify-center" : "justify-between gap-2"
        )}
      >
        <Link href="/courses" className="flex min-w-0 items-center">
          {collapsed ? (
            <Image
              src={iconLogo}
              alt="Beblocky"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
          ) : (
            <Image
              src={logo}
              alt="Beblocky"
              width={140}
              height={40}
              className="h-8 w-auto"
              priority
            />
          )}
        </Link>
        {showCollapseControl && !collapsed && onToggleCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleCollapsed}
            title="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showCollapseControl && collapsed && onToggleCollapsed && (
        <div className="flex justify-center border-b border-border/60 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleCollapsed}
            title="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const link = (
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );

          if (!collapsed) {
            return <div key={href}>{link}</div>;
          }

          return (
            <Tooltip key={href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-border/60 p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              {!collapsed && (
                <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
              )}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Toggle theme</TooltipContent>
          )}
        </Tooltip>

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-2",
            collapsed && "justify-center px-0"
          )}
        >
          <Avatar className="h-9 w-9 shrink-0 ring-2 ring-primary/20">
            {isLoading ? (
              <AvatarFallback className="animate-pulse" />
            ) : user?.image ? (
              <AvatarImage src={user.image} alt={user.name || "User"} />
            ) : (
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {user?.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user?.email || ""}
              </p>
            </div>
          )}
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 text-destructive hover:text-destructive",
                collapsed ? "justify-center px-0" : "justify-start"
              )}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign out</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Sign out</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useThemeContext();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      // Notify layout about width change
      window.dispatchEvent(
        new CustomEvent("beblocky-sidebar-toggle", { detail: { collapsed: next } })
      );
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-card px-3 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/courses">
          <Image
            src={logo}
            alt="Beblocky"
            width={120}
            height={32}
            className="h-7 w-auto"
          />
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-xl">
            <SidebarChrome collapsed={false} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden h-screen shrink-0 md:sticky md:top-0 md:block">
        <SidebarChrome
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          showCollapseControl
        />
      </div>
    </TooltipProvider>
  );
}
