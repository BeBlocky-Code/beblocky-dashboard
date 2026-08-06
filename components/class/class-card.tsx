"use client";

import { useState, type ComponentType } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  BookOpen,
  Calendar,
  Eye,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { IClass } from "@/types/class";

interface ModernClassCardProps {
  classData: IClass;
  onView: (classId: string) => void;
  onEdit: (classId: string) => void;
  onDelete: (classId: string) => void;
  onManageStudents: (classId: string) => void;
  onSettings: (classId: string) => void;
  viewMode?: "grid" | "list";
}

export function ClassCard({
  classData,
  onView,
  viewMode = "grid",
}: ModernClassCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const startDate = classData.startDate
    ? new Date(classData.startDate)
    : new Date();
  const endDate = classData.endDate
    ? new Date(classData.endDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const createdAt = classData.createdAt
    ? new Date(classData.createdAt)
    : new Date();

  const daysUntilEnd = Math.ceil(
    (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const progressPercentage = Math.max(
    0,
    Math.min(
      100,
      ((new Date().getTime() - startDate.getTime()) /
        (endDate.getTime() - startDate.getTime())) *
        100
    )
  );

  const status =
    classData.status || (classData.isActive ? "Active" : "Inactive");
  const isActive = status === "Active" || classData.isActive;
  const displayName = classData.name || classData.className;
  const classId = classData._id || "";

  const handleView = async () => {
    setIsLoading(true);
    try {
      await onView(classId);
    } finally {
      setIsLoading(false);
    }
  };

  if (viewMode === "list") {
    return (
      <Card
        className="group cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-all hover:bg-card/70 hover:shadow-md"
        onClick={handleView}
      >
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-bold transition-colors group-hover:text-primary">
                    {displayName}
                  </h3>
                  <StatusBadge active={isActive} status={status} />
                </div>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {classData.description}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {classData.students.length} students
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {classData.courses.length} courses
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {daysUntilEnd > 0 ? daysUntilEnd : 0} days left
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">
                  {Math.round(progressPercentage)}%
                </p>
                <Progress
                  value={progressPercentage}
                  className="mt-1 h-1.5 w-24"
                />
              </div>
              <Button
                onClick={handleView}
                size="sm"
                className="h-9 rounded-full px-4 text-xs font-bold"
                disabled={isLoading}
              >
                <Eye className="mr-2 h-3.5 w-3.5" />
                {isLoading ? "Loading…" : "View"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/70 hover:shadow-md"
      onClick={handleView}
    >
      <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <StatusBadge active={isActive} status={status} />
          </div>
        </div>
        <h3 className="mt-3 line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
          {displayName}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {classData.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-2">
          <Metric icon={Users} label="Students" value={classData.students.length} />
          <Metric icon={BookOpen} label="Courses" value={classData.courses.length} />
          <Metric
            icon={Clock}
            label="Days left"
            value={daysUntilEnd > 0 ? daysUntilEnd : 0}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              Class progress
            </span>
            <span className="font-medium">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Recent students
          </p>
          <div className="flex items-center gap-2">
            {classData.students.length > 0 ? (
              <>
                {classData.students.slice(0, 4).map((studentId, index) => (
                  <Avatar
                    key={studentId.toString()}
                    className="h-8 w-8 ring-2 ring-border/40"
                  >
                    <AvatarFallback className="bg-muted/40 text-xs font-semibold text-muted-foreground">
                      S{index + 1}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {classData.students.length > 4 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/40 bg-muted/30 text-xs font-medium">
                    +{classData.students.length - 4}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No students enrolled
              </p>
            )}
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <Button
            onClick={handleView}
            className="h-9 w-full rounded-full text-xs font-bold"
            size="sm"
            disabled={isLoading}
          >
            <Eye className="mr-2 h-3.5 w-3.5" />
            {isLoading ? "Loading…" : "View class"}
          </Button>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
            </span>
          </div>
          <span>Created {createdAt.toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ active, status }: { active: boolean; status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border text-[10px] font-black uppercase tracking-wide",
        active
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-border/40 bg-muted/30 text-muted-foreground"
      )}
    >
      {status}
    </Badge>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/30 bg-muted/20 px-2.5 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}
