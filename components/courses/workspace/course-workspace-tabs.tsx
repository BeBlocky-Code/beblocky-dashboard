"use client";

import { BookOpen, Flag, Layers, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceTab = "course" | "lessons" | "slides" | "challenges";

interface CourseWorkspaceTabsProps {
  value: WorkspaceTab;
  onChange: (tab: WorkspaceTab) => void;
  disabledTabs?: WorkspaceTab[];
}

const TABS: {
  value: WorkspaceTab;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { value: "course", label: "Course", icon: BookOpen },
  { value: "lessons", label: "Lessons", icon: PlayCircle },
  { value: "slides", label: "Slides", icon: Layers },
  { value: "challenges", label: "Challenges", icon: Flag },
];

export function CourseWorkspaceTabs({
  value,
  onChange,
  disabledTabs = [],
}: CourseWorkspaceTabsProps) {
  return (
    <div className="w-full max-w-xl mx-auto grid grid-cols-4 bg-muted/50 p-1.5 rounded-full border border-border/40">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const disabled = disabledTabs.includes(tab.value);
        const isActive = value === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            disabled={disabled}
            aria-label={tab.label}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-tight transition-[color,background-color] duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "text-white bg-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground bg-transparent",
              disabled &&
                "opacity-40 cursor-not-allowed hover:text-muted-foreground"
            )}
          >
            <Icon size={14} className="shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
