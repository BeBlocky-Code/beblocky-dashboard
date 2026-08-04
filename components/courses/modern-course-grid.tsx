"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MoreVertical,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  Star,
  Clock,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CourseStatus, CourseSubscriptionType } from "@/types/course";
import { DeleteCourseConfirmationDialog } from "./dialogs/delete-course-confirmation-dialog";
import { useRouter } from "next/navigation";
import { useCoursesWithDetails, useDeleteCourse } from "@/lib/hooks/queries";
import type { ClientCourse } from "@/lib/api/course";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/components/theme-provider";

export function ModernCourseGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<ClientCourse | null>(
    null
  );
  const router = useRouter();
  const { theme } = useThemeContext();
  const accentColor = theme === "dark" ? "#892FFF" : "#FF932C";

  const {
    data: courses = [],
    isLoading,
    error,
  } = useCoursesWithDetails();

  const deleteCourseMutation = useDeleteCourse();

  if (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : "Failed to fetch courses. Please try again."
    );
  }

  const filteredCourses = useMemo(() => {
    return courses.filter((course: ClientCourse) => {
      const matchesSearch =
        course.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseDescription
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        course.language.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "all" || course.status.toLowerCase() === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [courses, searchTerm, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      all: courses.length,
      active: courses.filter(
        (c: ClientCourse) => c.status === CourseStatus.ACTIVE
      ).length,
      draft: courses.filter(
        (c: ClientCourse) => c.status === CourseStatus.DRAFT
      ).length,
    };
  }, [courses]);

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await deleteCourseMutation.mutateAsync(courseId);
      toast.success("Course deleted successfully!");
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (err) {
      console.error("Error deleting course:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete course. Please try again."
      );
    }
  };

  const openDeleteDialog = (course: ClientCourse) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const tabs = [
    { value: "all", label: "All", icon: BookOpen, count: tabCounts.all },
    {
      value: "active",
      label: "Active",
      icon: TrendingUp,
      count: tabCounts.active,
    },
    { value: "draft", label: "Draft", icon: Clock, count: tabCounts.draft },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Your courses</h2>
          <p className="text-sm text-muted-foreground">
            Filter by status or search by title
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search courses…"
            className="h-10 rounded-full border-border/40 bg-card/40 pl-10 backdrop-blur-sm focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="inline-flex h-auto w-full grid-cols-3 gap-0 rounded-full border border-border/40 bg-muted/50 p-1.5 lg:grid lg:w-auto">
          {tabs.map(({ value, label, icon: Icon, count }) => {
            const active = activeTab === value;
            return (
              <TabsTrigger
                key={value}
                value={value}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-tight transition-all duration-300",
                  "data-[state=active]:shadow-none data-[state=active]:text-white",
                  !active && "text-muted-foreground hover:text-foreground"
                )}
                style={{
                  backgroundColor: active ? accentColor : "transparent",
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label}</span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black",
                    active
                      ? "bg-white/20 text-white"
                      : "border border-border/20 bg-muted/30 text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <motion.div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
            layout
          >
            <AnimatePresence>
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                    >
                      <Card className="h-72 animate-pulse rounded-2xl border border-border/40 bg-card/30">
                        <div className="space-y-4 p-6">
                          <div className="h-4 w-3/4 rounded-full bg-muted/50" />
                          <div className="h-3 w-full rounded-full bg-muted/40" />
                          <div className="h-3 w-2/3 rounded-full bg-muted/40" />
                        </div>
                      </Card>
                    </motion.div>
                  ))
                : filteredCourses.map((course: ClientCourse, index: number) => (
                    <motion.div
                      key={course._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      layout
                    >
                      <ModernCourseCard
                        course={course}
                        onDelete={openDeleteDialog}
                      />
                    </motion.div>
                  ))}
            </AnimatePresence>
          </motion.div>

          {!isLoading && filteredCourses.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-border/40 bg-card/30 px-6 py-16 text-center backdrop-blur-sm"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                <BookOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No courses found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : `No ${activeTab} courses available`}
              </p>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {courseToDelete && (
        <DeleteCourseConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={closeDeleteDialog}
          courseTitle={courseToDelete.courseTitle}
          onConfirm={() => handleDeleteCourse(courseToDelete._id)}
          isLoading={deleteCourseMutation.isPending}
        />
      )}
    </div>
  );
}

interface ModernCourseCardProps {
  course: ClientCourse;
  onDelete: (course: ClientCourse) => void;
}

function ModernCourseCard({ course, onDelete }: ModernCourseCardProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/courses/${course._id}/edit`);
  };

  const handleDelete = () => {
    onDelete(course);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/70 hover:shadow-md"
      onClick={handleEdit}
    >
      <div className="border-b border-border/40 bg-muted/20 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <Badge
              variant="outline"
              className={cn(
                "rounded-full border text-[10px] font-black uppercase tracking-wide",
                course.status === CourseStatus.ACTIVE
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-border/40 bg-muted/30 text-muted-foreground"
              )}
            >
              {course.status}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem
                onClick={handleEdit}
                className="flex items-center"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="flex items-center text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1.5">
          <h3 className="line-clamp-2 text-lg font-bold transition-colors group-hover:text-primary">
            {course.courseTitle}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {course.courseDescription}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          <Metric
            icon={Users}
            label="Students"
            value={course.studentsCount || 0}
          />
          <Metric
            icon={BookOpen}
            label="Lessons"
            value={course.lessonsCount || 0}
          />
          <Metric
            icon={Layers}
            label="Slides"
            value={course.slidesCount || 0}
          />
        </div>

        {course.status === CourseStatus.ACTIVE && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Completion rate</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
              <div className="h-full w-0 rounded-full bg-primary" />
            </div>
          </div>
        )}

        {course.status === CourseStatus.ACTIVE && course.rating > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{course.rating}</span>
            <span className="text-xs text-muted-foreground">
              ({course.studentsCount || 0} reviews)
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/40 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge
              variant="outline"
              className="rounded-full border-border/40 bg-muted/30 text-[10px] font-semibold text-muted-foreground"
            >
              {course.language}
            </Badge>
            <span className="text-xs">{course.courseLanguage}</span>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "rounded-full border text-[10px] font-black uppercase tracking-wide",
              subTypeBadgeClass(course.subType)
            )}
          >
            {course.subType}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Updated {course.lastUpdated || "Recently"}
        </p>
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-1 rounded-xl border border-border/30 bg-muted/20 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <p className="text-base font-semibold">{value}</p>
    </div>
  );
}

function subTypeBadgeClass(subType: CourseSubscriptionType) {
  switch (subType) {
    case CourseSubscriptionType.PRO:
    case CourseSubscriptionType.BUILDER:
      return "border-primary/30 bg-primary/10 text-primary";
    case CourseSubscriptionType.ORGANIZATION:
    case CourseSubscriptionType.STARTER:
      return "border-secondary/30 bg-secondary/10 text-secondary-foreground dark:text-secondary";
    default:
      return "border-border/40 bg-muted/30 text-muted-foreground";
  }
}
