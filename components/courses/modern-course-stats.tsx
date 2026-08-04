"use client";

import { Card } from "@/components/ui/card";
import { Book, Users, Clock, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  useCoursesWithDetails,
  useAllStudents,
  useAllProgress,
  useCertificateStats,
} from "@/lib/hooks/queries";
import { cn } from "@/lib/utils";

export function ModernCourseStats() {
  const { data: courses = [], isLoading: coursesLoading } =
    useCoursesWithDetails();
  const { data: students = [], isLoading: studentsLoading } = useAllStudents();
  const { data: progress = [], isLoading: progressLoading } = useAllProgress();
  const { data: certStats, isLoading: certsLoading } = useCertificateStats();

  const isLoading =
    coursesLoading || studentsLoading || progressLoading || certsLoading;

  const stats = useMemo(() => {
    const averageCompletion =
      progress.length > 0
        ? Math.round(
            progress.reduce(
              (sum, record) => sum + (record.completionPercentage || 0),
              0
            ) / progress.length
          )
        : 0;

    return {
      totalCourses: courses.length,
      activeStudents: students.length,
      averageCompletion,
      certifications: certStats?.total ?? 0,
    };
  }, [courses, students, progress, certStats]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ModernStatCard
        title="Total Courses"
        value={isLoading ? "…" : stats.totalCourses.toString()}
        icon={Book}
        iconClass="text-primary bg-primary/10"
        delay={0}
        isLoading={isLoading}
      />
      <ModernStatCard
        title="Active Students"
        value={isLoading ? "…" : stats.activeStudents.toString()}
        icon={Users}
        iconClass="text-secondary bg-secondary/10"
        delay={0.05}
        isLoading={isLoading}
      />
      <ModernStatCard
        title="Average Completion"
        value={isLoading ? "…" : `${stats.averageCompletion}%`}
        icon={Clock}
        iconClass="text-primary bg-muted/40"
        delay={0.1}
        isLoading={isLoading}
      />
      <ModernStatCard
        title="Certifications"
        value={isLoading ? "…" : stats.certifications.toString()}
        icon={Trophy}
        iconClass="text-secondary bg-muted/40"
        delay={0.15}
        isLoading={isLoading}
      />
    </div>
  );
}

interface ModernStatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  delay: number;
  isLoading?: boolean;
}

function ModernStatCard({
  title,
  value,
  icon: Icon,
  iconClass,
  delay,
  isLoading = false,
}: ModernStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/60">
        <div className="p-5">
          <div
            className={cn(
              "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
              iconClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold tracking-tight",
              isLoading && "animate-pulse text-muted-foreground"
            )}
          >
            {value}
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
