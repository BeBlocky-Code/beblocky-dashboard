"use client";

import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Users,
  TrendingUp,
  Clock,
} from "lucide-react";
import { ClassCard } from "@/components/class/class-card";
import { ModernCreateClassDialog } from "@/components/class/create-class-dialog";
import { ClassStatsCard } from "@/components/class/class-stats-card";
import { motion, AnimatePresence } from "framer-motion";
import type { IClass, ICreateClassDto, IClassStats } from "@/types/class";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import {
  useClasses,
  useDeleteClass,
  useUserByEmail,
  useTeacherByUserId,
} from "@/lib/hooks/queries";
import { classApi } from "@/lib/api/class";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/components/theme-provider";

export default function ModernClassesPage() {
  const session = useSession();
  const { theme } = useThemeContext();
  const accentColor = theme === "dark" ? "#892FFF" : "#FF932C";

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const email = session.data?.user?.email;

  const { data: userData } = useUserByEmail(email, {
    enabled: !session.isPending && !!email,
  });

  const sessionRoles = session.data?.user?.roles;
  const isTeacher =
    (sessionRoles && sessionRoles.length > 0
      ? sessionRoles.includes("teacher")
      : userData?.role === "teacher") ?? false;

  useTeacherByUserId(session.data?.user?.id ?? userData?._id, userData ?? null, {
    enabled: !!userData && isTeacher,
  });

  const {
    data: classes = [],
    isLoading,
    error: classesError,
  } = useClasses(userData ?? null, undefined, {
    enabled: !!userData,
  });

  const deleteClassMutation = useDeleteClass();

  if (classesError) {
    toast.error("Failed to load classes");
  }

  const filteredClasses = useMemo(() => {
    let filtered = classes;

    if (searchQuery) {
      filtered = filtered.filter(
        (cls: IClass) =>
          cls.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cls.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === "active") {
      filtered = filtered.filter((cls: IClass) => cls.isActive);
    } else if (activeTab === "draft") {
      filtered = filtered.filter((cls: IClass) => !cls.isActive);
    }

    return filtered;
  }, [classes, searchQuery, activeTab]);

  const classStatsQueries = useQueries({
    queries: classes.map((cls: IClass) => ({
      queryKey: queryKeys.classes.stats(cls._id || ""),
      queryFn: () => classApi.getClassStats(cls._id!, userData!),
      enabled: !!userData && !!cls._id,
      staleTime: 60_000,
    })),
  });

  const overallStats = useMemo<IClassStats | null>(() => {
    if (classes.length === 0) return null;

    const totalStudents = classes.reduce(
      (sum: number, cls: IClass) => sum + (cls.students?.length || 0),
      0
    );
    const totalCourses = classes.reduce(
      (sum: number, cls: IClass) => sum + (cls.courses?.length || 0),
      0
    );

    const statsResults = classStatsQueries
      .map((q) => q.data)
      .filter((s): s is IClassStats => !!s);

    const averageProgress =
      statsResults.length > 0
        ? Math.round(
            statsResults.reduce((sum, s) => sum + (s.averageProgress || 0), 0) /
              statsResults.length
          )
        : 0;

    const activeStudents =
      statsResults.length > 0
        ? statsResults.reduce((sum, s) => sum + (s.activeStudents || 0), 0)
        : 0;

    return {
      totalStudents,
      totalCourses,
      activeStudents,
      averageProgress,
    };
  }, [classes, classStatsQueries]);

  const tabCounts = useMemo(() => {
    return {
      all: classes.length,
      active: classes.filter((c: IClass) => c.isActive).length,
      draft: classes.filter((c: IClass) => !c.isActive).length,
    };
  }, [classes]);

  const tabs = [
    { value: "all", label: "All", icon: Users, count: tabCounts.all },
    {
      value: "active",
      label: "Active",
      icon: TrendingUp,
      count: tabCounts.active,
    },
    { value: "draft", label: "Draft", icon: Clock, count: tabCounts.draft },
  ] as const;

  const handleCreateClass = async (_data: ICreateClassDto) => {
    // Mutation in the dialog invalidates the classes query
  };

  const handleViewClass = (classId: string) => {
    window.location.href = `/classes/${classId}`;
  };

  const handleEditClass = (_classId: string) => {
    toast.info(
      "Edit functionality coming soon! You'll be able to edit class details."
    );
  };

  const handleDeleteClass = async (classId: string) => {
    if (!userData) {
      toast.error("User data not available");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this class? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteClassMutation.mutateAsync({ classId, user: userData });
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Failed to delete class");
    }
  };

  const handleManageStudents = (_classId: string) => {
    toast.info(
      "Student management functionality coming soon! You'll be able to add/remove students."
    );
  };

  const handleSettings = (_classId: string) => {
    toast.info(
      "Class settings functionality coming soon! You'll be able to configure class settings."
    );
  };

  if (isLoading || session.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-muted/10">
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">
            {session.isPending
              ? "Checking authentication…"
              : "Loading classes…"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-muted/10">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Classes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create, organize, and track student progress
            </p>
          </div>
          <Button
            className="h-10 rounded-full px-5 text-xs font-bold shadow-sm"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New class
          </Button>
        </div>

        {overallStats && (
          <div className="mb-8">
            <ClassStatsCard stats={overallStats} />
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Your classes</h2>
              <p className="text-sm text-muted-foreground">
                Filter by status or search by name
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search classes…"
                className="h-10 rounded-full border-border/40 bg-card/40 pl-10 backdrop-blur-sm focus-visible:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                      <span>{label}</span>
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

              <div className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/50 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    viewMode === "grid" && "bg-card shadow-sm"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "h-8 w-8 rounded-full",
                    viewMode === "list" && "bg-card shadow-sm"
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-6">
              <motion.div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
                    : "space-y-3"
                }
                layout
              >
                <AnimatePresence>
                  {filteredClasses.map((classData: IClass, index: number) => (
                    <motion.div
                      key={classData._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                      layout
                    >
                      <ClassCard
                        classData={classData}
                        onView={handleViewClass}
                        onEdit={handleEditClass}
                        onDelete={handleDeleteClass}
                        onManageStudents={handleManageStudents}
                        onSettings={handleSettings}
                        viewMode={viewMode}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredClasses.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-border/40 bg-card/30 px-6 py-16 text-center backdrop-blur-sm"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40">
                    <Users className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No classes found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Create your first class to get started"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="mt-6 h-10 rounded-full px-5 text-xs font-bold"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create first class
                    </Button>
                  )}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <ModernCreateClassDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={handleCreateClass}
        />
      </div>
    </div>
  );
}
