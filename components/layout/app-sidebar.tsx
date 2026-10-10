"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  BookOpen,
  Building2,
  ChevronLeft,
  GraduationCap,
  Package,
  Users,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import logo from "@/lib/images/logo.png";
import iconLogo from "@/lib/images/icon-logo.png";
import { SidebarThemeToggle } from "./sidebar-theme-toggle";
import { SidebarUserButton } from "./sidebar-user-button";

const SIDEBAR_COLLAPSED_KEY = "beblocky-dashboard-sidebar-collapsed";

const navItems = [
  {
    href: "/courses",
    title: "Courses",
    icon: BookOpen,
    roles: ["teacher", "admin", "organization"],
  },
  {
    href: "/school",
    title: "School",
    icon: Building2,
    roles: ["teacher", "organization"],
  },
  {
    href: "/bundles",
    title: "Bundles",
    icon: Package,
    roles: ["teacher", "admin"],
  },
  {
    href: "/classes",
    title: "Classes",
    icon: Users,
    roles: ["teacher", "organization"],
  },
  {
    href: "/admin/organizations",
    title: "Organizations",
    icon: Building2,
    roles: ["admin"],
  },
  {
    href: "/admin/students",
    title: "Students",
    icon: GraduationCap,
    roles: ["teacher", "admin", "organization"],
  },
] as const;

export function AppSidebar() {
  const path = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const roles = session?.user?.roles ?? [];

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1") {
        setIsCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const toggleCollapsed = () => {
    if (isMobile) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    path === href || path.startsWith(`${href}/`);

  const visibleItems = navItems.filter((item) =>
    item.roles.some((allowed) => roles.includes(allowed)),
  );

  return (
    <div className="flex h-screen">
      <div
        className={cn(
          "relative flex w-64 max-md:w-16 flex-col border-r border-border bg-card transition-all duration-300",
          isCollapsed && "md:w-16",
        )}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute top-4 z-20 max-md:hidden",
            "flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card shadow-lg",
            "transition-all duration-300 hover:scale-110 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xl",
            isCollapsed ? "left-12" : "left-60",
          )}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-300",
              isCollapsed && "rotate-180",
            )}
          />
        </button>

        <div className="relative p-6">
          <div className="flex h-10 items-center justify-center">
            <Link
              href="/courses"
              prefetch={false}
              className={cn("flex items-center gap-2", isCollapsed && "justify-center")}
            >
              <Image
                src={logo}
                alt="BeBlocky"
                width={150}
                height={40}
                className={cn(
                  "h-10 w-auto max-md:hidden",
                  isCollapsed && "md:hidden",
                )}
              />
              <Image
                src={iconLogo}
                alt=""
                width={40}
                height={40}
                className={cn(
                  "hidden h-10 w-10 max-md:block",
                  isCollapsed && "md:block",
                )}
              />
            </Link>
          </div>
        </div>

        <div className={cn("space-y-4 px-6 pb-4", isCollapsed && "px-2")}>
          <div
            className={cn(
              "flex items-center justify-between",
              isCollapsed && "justify-center",
            )}
          >
            {!isCollapsed && (
              <span className="text-sm font-medium text-muted-foreground">
                Theme
              </span>
            )}
            <SidebarThemeToggle />
          </div>
        </div>

        <nav className={cn("flex-1 space-y-2", isCollapsed ? "px-2" : "px-4")}>
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <div key={item.href}>
                <Link href={item.href} prefetch={false}>
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                      active
                        ? "bg-primary/10 text-primary border-r-4 border-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                      isCollapsed && "justify-center px-2",
                    )}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    {!isCollapsed && <span className="flex-1">{item.title}</span>}
                  </div>
                </Link>
              </div>
            );
          })}
        </nav>

        <div
          className={cn(
            "overflow-hidden border-t border-border",
            isCollapsed && "px-2",
          )}
        >
          <SidebarUserButton isCollapsed={isCollapsed} />
        </div>
      </div>
    </div>
  );
}
