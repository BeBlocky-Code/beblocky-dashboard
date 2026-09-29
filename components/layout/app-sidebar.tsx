"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
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
    roles.some((role) =>
      item.roles.includes(role as (typeof item.roles)[number]),
    ),
  );

  return (
    <div className="flex h-screen">
      <div
        className={cn(
          "relative flex flex-col bg-card border-r border-border transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <motion.button
          type="button"
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute top-4 z-20",
            "flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card shadow-lg",
            "transition-all duration-300 hover:scale-110 hover:border-primary/50 hover:bg-primary/5 hover:shadow-xl",
            isCollapsed ? "left-12" : "left-60",
            isMobile && "hidden",
          )}
          whileHover={{ scale: isMobile ? 1 : 1.1 }}
          whileTap={{ scale: isMobile ? 1 : 0.96 }}
          disabled={isMobile}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </motion.button>

        <motion.div
          className="relative p-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center">
            <Link
              href="/courses"
              className={cn("flex items-center gap-2", isCollapsed && "justify-center")}
            >
              <Image
                src={isCollapsed ? iconLogo : logo}
                alt="BeBlocky"
                width={isCollapsed ? 40 : 150}
                height={isCollapsed ? 40 : 150}
              />
            </Link>
          </div>
        </motion.div>

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
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Link href={item.href}>
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
              </motion.div>
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
