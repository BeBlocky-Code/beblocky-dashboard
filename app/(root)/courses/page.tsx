"use client";

import { useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserByEmail, useTeacherByUserId } from "@/lib/hooks/queries";
import ModernCourseDashboard from "@/components/courses/modern-course-dashboard";
import { OrganizationRequirementMessage } from "@/components/courses/organization-requirement-message";

export default function CoursesPage() {
  const session = useSession();
  const email = session.data?.user?.email;
  const sessionUserId = session.data?.user?.id;

  // Fetch user data using TanStack Query
  const {
    data: userData,
    isLoading: isUserLoading,
  } = useUserByEmail(email, {
    enabled: !session.isPending && !!email,
  });

  // Fetch teacher data using TanStack Query (only for teachers/admins)
  const {
    data: teacherData,
    isLoading: isTeacherLoading,
    error: teacherError,
  } = useTeacherByUserId(sessionUserId, userData ?? null, {
    enabled:
      !session.isPending &&
      !!sessionUserId &&
      !!userData &&
      (userData.role === "teacher" || userData.role === "admin"),
  });

  // Compute organization status
  const hasOrganization = useMemo(() => {
    // If user is not teacher/admin, allow access
    if (userData && userData.role !== "teacher" && userData.role !== "admin") {
      return true;
    }

    // If teacher query errored with "Teacher not found", no organization
    if (teacherError instanceof Error && teacherError.message === "Teacher not found") {
      return false;
    }

    // If teacher data exists, check for organization
    if (teacherData) {
      return (
        !!teacherData.organizationId ||
        !!(teacherData as any).organization_id ||
        !!(teacherData as any).organization ||
        !!(teacherData as any).orgId ||
        !!(teacherData as any).org_id
      );
    }

    // If there was a non-404 error, allow access
    if (teacherError && !(teacherError instanceof Error && teacherError.message === "Teacher not found")) {
      return true;
    }

    // Still loading or undetermined
    return null;
  }, [userData, teacherData, teacherError]);

  // Determine loading state
  const isLoading =
    session.isPending ||
    isUserLoading ||
    (userData && (userData.role === "teacher" || userData.role === "admin") && isTeacherLoading);

  // Show loading state while data is being fetched
  if (isLoading || hasOrganization === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-8 pt-24">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <span className="ml-3 text-muted-foreground">
              {session.isPending
                ? "Checking authentication..."
                : "Loading courses..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Only render organization requirement if we have complete data and user is teacher/admin without organization
  if (
    userData &&
    (userData.role === "teacher" || userData.role === "admin") &&
    hasOrganization === false
  ) {
    return (
      <OrganizationRequirementMessage
        userRole={userData.role}
        organizationId={teacherData?.organizationId?.toString()}
      />
    );
  }

  // Show normal course dashboard for users with organization or non-teacher/admin users
  return <ModernCourseDashboard />;
}
