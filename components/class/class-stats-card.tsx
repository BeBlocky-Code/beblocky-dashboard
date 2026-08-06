"use client";

import { Card } from "@/components/ui/card";
import { Users, BookOpen, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import type { IClassStats } from "@/types/class";
import { cn } from "@/lib/utils";

interface ModernClassStatsCardProps {
  stats: IClassStats;
  className?: string;
}

export function ClassStatsCard({
  stats,
  className,
}: ModernClassStatsCardProps) {
  const items = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      hint: "Active learners in classes",
      icon: Users,
      iconClass: "text-primary bg-primary/10",
    },
    {
      title: "Active Courses",
      value: stats.totalCourses,
      hint: "Total courses",
      icon: BookOpen,
      iconClass: "text-secondary bg-secondary/10",
    },
    {
      title: "Average Progress",
      value: `${stats.averageProgress}%`,
      hint: null,
      icon: TrendingUp,
      iconClass: "text-primary bg-muted/40",
      progress: stats.averageProgress,
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      hint: "Currently enrolled",
      icon: Users,
      iconClass: "text-secondary bg-muted/40",
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  {item.title}
                </p>
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl",
                    item.iconClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight">{item.value}</p>
              {item.progress != null ? (
                <Progress value={item.progress} className="mt-3 h-1.5" />
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
