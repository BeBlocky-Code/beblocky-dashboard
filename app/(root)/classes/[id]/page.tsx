"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import type { IClass } from "@/types/class";
import type { IUser } from "@/types/user";
import type { IStudent } from "@/types/student";
import type { ClientCourse } from "@/lib/api/course";
import { studentApi } from "@/lib/api/student";
import { fetchCourse } from "@/lib/api/course";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { ModernManageStudentsDialog } from "@/components/class/dialog/manage-students-dialog";
import { ModernEditClassDialog } from "@/components/class/dialog/edit-class-dialog";
import { ModernClassSettingsDialog } from "@/components/class/dialog/class-setting-dialog";
import { DeleteClassConfirmationDialog } from "@/components/class/dialog/delete-class-confirmation-dialog";
import {
  useClass,
  useDeleteClass,
  useUpdateClass,
  useUpdateClassSettings,
  useUserByEmail,
} from "@/lib/hooks/queries";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/components/theme-provider";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const session = useSession();
  const { theme } = useThemeContext();
  const accentColor = theme === "dark" ? "#892FFF" : "#FF932C";
  const classId = params.id as string;

  const [students, setStudents] = useState<IStudent[]>([]);
  const [courses, setCourses] = useState<ClientCourse[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [isClassSettingsOpen, setIsClassSettingsOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);

  const email = session.data?.user?.email;

  // Fetch user data using TanStack Query
  const { data: userData } = useUserByEmail(email, {
    enabled: !session.isPending && !!email,
  });

  // Fetch class data using TanStack Query
  const {
    data: classData,
    isLoading,
    error: classError,
  } = useClass(classId, userData ?? null, {
    enabled: !!classId && !!userData,
  });

  // Mutations
  const deleteClassMutation = useDeleteClass();
  const updateClassMutation = useUpdateClass();
  const updateSettingsMutation = useUpdateClassSettings();

  // Show error toast if fetch failed
  if (classError) {
    toast.error("Failed to load class details");
  }

  // Load students and courses when class data is available
  useEffect(() => {
    if (classData && session.data?.user?.email) {
      loadStudentsAndCourses(classData);
    }
  }, [classData, session.data?.user?.email]);

  const loadStudentsAndCourses = async (classDetails: IClass) => {
    try {
      // Load students data with user information
      const studentsData = await Promise.all(
        classDetails.students.map(async (studentId) => {
          try {
            const student = await studentApi.getStudentByUserId(
              studentId.toString(),
              {
                _id: studentId.toString(),
                email: session.data?.user?.email || "",
                role: "student",
              } as IUser
            );

            return {
              ...student,
              displayName: student.userId || studentId.toString(),
            };
          } catch (error) {
            console.error(`Failed to load student ${studentId}:`, error);
            return {
              _id: studentId.toString(),
              userId: studentId.toString(),
              displayName: `Student ${studentId.toString().slice(-4)}`,
              dateOfBirth: new Date(),
              grade: 1,
              gender: "other" as any,
              enrolledCourses: [],
              coins: 0,
              codingStreak: 0,
              lastCodingActivity: new Date(),
              totalCoinsEarned: 0,
              totalTimeSpent: 0,
              goals: [],
              subscription: "free",
              section: "A",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        })
      );
      setStudents(studentsData);

      // Load courses data
      const coursesData = await Promise.all(
        classDetails.courses.map(async (courseId) => {
          try {
            return await fetchCourse(courseId.toString());
          } catch (error) {
            console.error(`Failed to load course ${courseId}:`, error);
            return {
              _id: courseId.toString(),
              courseTitle: `Course ${courseId.toString().slice(-4)}`,
              courseDescription: "Course description not available",
              courseLanguage: "English",
              slides: [],
              lessons: [],
              students: [],
              organization: [],
              subType: "Free" as any,
              status: "Draft" as any,
              rating: 0,
              language: "English",
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          }
        })
      );
      setCourses(coursesData);
    } catch (error) {
      console.error("Failed to load students and courses:", error);
    }
  };

  const handleDeleteClass = async () => {
    if (!userData || !classData) return;

    try {
      await deleteClassMutation.mutateAsync({ classId, user: userData });
      toast.success("Class deleted successfully!");
      router.push("/classes");
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Failed to delete class");
    } finally {
      setIsDeleteConfirmationOpen(false);
    }
  };

  const handleShowDeleteConfirmation = () => {
    setIsDeleteConfirmationOpen(true);
  };

  const handleEditClass = () => {
    setIsEditClassOpen(true);
  };

  const handleSaveEdit = async (updatedClass: any) => {
    if (!userData || !classData) return;

    try {
      const updateData: any = {
        className: updatedClass.name || updatedClass.className,
        description: updatedClass.description,
        startDate: updatedClass.startDate
          ? updatedClass.startDate.toISOString()
          : undefined,
        endDate: updatedClass.endDate
          ? updatedClass.endDate.toISOString()
          : undefined,
        settings: updatedClass.settings,
      };

      if (updatedClass.courses && Array.isArray(updatedClass.courses)) {
        updateData.courses = updatedClass.courses.map((id: any) =>
          id.toString()
        );
      }
      if (updatedClass.students && Array.isArray(updatedClass.students)) {
        updateData.students = updatedClass.students.map((id: any) =>
          id.toString()
        );
      }

      await updateClassMutation.mutateAsync({
        classId,
        data: updateData,
        user: userData,
      });

      toast.success("Class updated successfully!");
      setIsEditClassOpen(false);
    } catch (error) {
      console.error("Failed to update class:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update class"
      );
    }
  };

  const handleManageStudents = () => {
    setIsManageStudentsOpen(true);
  };

  const handleSettings = () => {
    setIsClassSettingsOpen(true);
  };

  const handleSaveSettings = async (settings: any) => {
    if (!userData || !classData) return;

    try {
      await updateSettingsMutation.mutateAsync({
        classId,
        settings: {
          allowStudentEnrollment: settings.allowStudentEnrollment,
          requireApproval: settings.requireApproval,
          autoProgress: settings.autoProgress,
        },
        user: userData,
      });

      toast.success("Class settings updated successfully!");
      setIsClassSettingsOpen(false);
    } catch (error) {
      console.error("Failed to update class settings:", error);
      toast.error("Failed to update class settings");
    }
  };

  if (isLoading || session.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-muted/10">
        <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card/40 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">
            {session.isPending
              ? "Checking authentication…"
              : "Loading class…"}
          </span>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-full bg-muted/10">
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto max-w-md rounded-2xl border border-border/40 bg-card/40 px-6 py-12 text-center shadow-sm backdrop-blur-sm">
            <h1 className="text-xl font-bold tracking-tight">Class not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The class you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button
              onClick={() => router.push("/classes")}
              className="mt-6 h-10 rounded-full px-5 text-xs font-bold"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to classes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle undefined dates with fallbacks
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

  return (
    <div className="min-h-full bg-muted/10">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/classes")}
            className="mb-4 h-9 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to classes
          </Button>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full border text-[10px] font-black uppercase tracking-wide",
                    isActive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-border/40 bg-muted/30 text-muted-foreground"
                  )}
                >
                  {status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ID: {classData._id}
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {displayName}
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {classData.description || "No description available"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleEditClass}
                variant="outline"
                className="h-9 rounded-full border-border/40 px-4 text-xs font-bold"
              >
                <Edit className="mr-2 h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                onClick={handleManageStudents}
                variant="outline"
                className="h-9 rounded-full border-border/40 px-4 text-xs font-bold"
              >
                <UserPlus className="mr-2 h-3.5 w-3.5" />
                Students
              </Button>
              <Button
                onClick={handleSettings}
                variant="outline"
                className="h-9 rounded-full border-border/40 px-4 text-xs font-bold"
              >
                <Settings className="mr-2 h-3.5 w-3.5" />
                Settings
              </Button>
              <Button
                onClick={handleShowDeleteConfirmation}
                variant="destructive"
                className="h-9 rounded-full px-4 text-xs font-bold"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Students",
              value: classData.students.length,
              icon: Users,
              iconClass: "text-primary bg-primary/10",
            },
            {
              title: "Courses",
              value: classData.courses.length,
              icon: BookOpen,
              iconClass: "text-secondary bg-secondary/10",
            },
            {
              title: "Progress",
              value: `${Math.round(progressPercentage)}%`,
              icon: TrendingUp,
              iconClass: "text-primary bg-muted/40",
            },
            {
              title: "Days left",
              value: daysUntilEnd > 0 ? daysUntilEnd : 0,
              icon: Clock,
              iconClass: "text-secondary bg-muted/40",
            },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-sm backdrop-blur-sm">
                  <div
                    className={cn(
                      "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
                      item.iconClass
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">
                    {item.value}
                  </p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="inline-flex h-auto w-full grid-cols-4 gap-0 rounded-full border border-border/40 bg-muted/50 p-1.5 lg:grid lg:w-auto">
            {(
              [
                { value: "overview", label: "Overview" },
                { value: "students", label: "Students" },
                { value: "courses", label: "Courses" },
                { value: "settings", label: "Settings" },
              ] as const
            ).map(({ value, label }) => {
              const active = activeTab === value;
              return (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-full px-4 py-2 text-xs font-bold uppercase tracking-tight transition-all duration-300",
                    "data-[state=active]:shadow-none data-[state=active]:text-white",
                    !active && "text-muted-foreground hover:text-foreground"
                  )}
                  style={{
                    backgroundColor: active ? accentColor : "transparent",
                  }}
                >
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4 text-primary" />
                    Class schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start date</span>
                    <span className="font-medium">
                      {startDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End date</span>
                    <span className="font-medium">
                      {endDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max students</span>
                    <span className="font-medium">
                      {classData.maxStudents || "Unlimited"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Info className="h-4 w-4 text-primary" />
                    Class information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Description</span>
                    <p className="mt-1">
                      {classData.description || "No description available"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border text-[10px] font-black uppercase",
                        isActive
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border/40 bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Organization</span>
                    <p className="mt-1 font-mono text-xs">
                      {classData.organizationId?.toString() || "Not assigned"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-primary" />
                  Enrolled students ({students.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="space-y-2">
                    {students.map((student, index) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {student.displayName?.slice(0, 2).toUpperCase() ||
                              `S${index + 1}`}
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              {student.displayName || `Student ${index + 1}`}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Grade {student.grade}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/40 text-[10px]"
                          >
                            {student.subscription}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/40 text-[10px]"
                          >
                            {student.coins} coins
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/40 px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No students enrolled yet
                    </p>
                    <Button
                      onClick={handleManageStudents}
                      className="mt-4 h-9 rounded-full px-4 text-xs font-bold"
                    >
                      <UserPlus className="mr-2 h-3.5 w-3.5" />
                      Add students
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Assigned courses ({courses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course._id}
                        className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10">
                            <BookOpen className="h-4 w-4 text-secondary" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">
                              {course.courseTitle}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {course.courseLanguage} • {course.subType}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border text-[10px] font-black uppercase",
                              course.status === "Active"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "border-border/40 bg-muted/30 text-muted-foreground"
                            )}
                          >
                            {course.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="rounded-full border-border/40 text-[10px]"
                          >
                            {course.lessonsCount || course.lessons?.length || 0}{" "}
                            lessons
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/40 px-6 py-10 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No courses assigned yet
                    </p>
                    <Button className="mt-4 h-9 rounded-full px-4 text-xs font-bold">
                      <BookOpen className="mr-2 h-3.5 w-3.5" />
                      Assign courses
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4 text-primary" />
                  Class settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Allow student enrollment
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/40 text-[10px] font-bold uppercase"
                  >
                    {classData.settings?.allowStudentEnrollment
                      ? "Enabled"
                      : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Require approval</span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/40 text-[10px] font-bold uppercase"
                  >
                    {classData.settings?.requireApproval
                      ? "Required"
                      : "Not required"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Auto progress</span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/40 text-[10px] font-bold uppercase"
                  >
                    {classData.settings?.autoProgress ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ModernManageStudentsDialog
        open={isManageStudentsOpen}
        onOpenChange={setIsManageStudentsOpen}
        classId={classId}
        className={displayName}
      />

      {classData && (
        <ModernEditClassDialog
          open={isEditClassOpen}
          onOpenChange={setIsEditClassOpen}
          classData={classData}
          onSave={handleSaveEdit}
        />
      )}

      {classData && (
        <ModernClassSettingsDialog
          open={isClassSettingsOpen}
          onOpenChange={setIsClassSettingsOpen}
          classData={classData}
          onSave={handleSaveSettings}
        />
      )}

      <DeleteClassConfirmationDialog
        open={isDeleteConfirmationOpen}
        onOpenChange={setIsDeleteConfirmationOpen}
        className={displayName}
        onConfirm={handleDeleteClass}
        isLoading={deleteClassMutation.isPending}
      />
    </div>
  );
}
