"use client";

import { useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useUserByEmail, useTeacherByUserId } from "@/lib/hooks/queries";
import ModernCourseDashboard from "@/components/courses/modern-course-dashboard";
import { OrganizationRequirementMessage } from "@/components/courses/organization-requirement-message";
import { CoursesPageSkeleton } from "@/components/skeletons";

function isTeacherOrAdminRole(
  role: string | undefined,
  roles: string[] | undefined
) {
  // Prefer IdP roles when present — Nest users can be stale legacy rows
  if (roles && roles.length > 0) {
    return roles.some((r) => r === "teacher" || r === "admin");
  }
  return role === "teacher" || role === "admin";
}

export default function CoursesPage() {
  const session = useSession();
  const email = session.data?.user?.email;
  const sessionUserId = session.data?.user?.id;
  const sessionRoles = session.data?.user?.roles;

  // Fetch user data using TanStack Query
  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUserByEmail(email, {
    enabled: !session.isPending && !!email,
  });

  const canManageCourses = isTeacherOrAdminRole(userData?.role, sessionRoles);

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
      canManageCourses,
  });

  // Compute organization status
  const hasOrganization = useMemo(() => {
    // Non-teachers can view the catalog without an org association
    if (!canManageCourses) {
      return true;
    }

    // If teacher query errored with "Teacher not found", no organization
    if (
      teacherError instanceof Error &&
      teacherError.message === "Teacher not found"
    ) {
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
    if (
      teacherError &&
      !(
        teacherError instanceof Error &&
        teacherError.message === "Teacher not found"
      )
    ) {
      return true;
    }

    // Still loading or undetermined
    return null;
  }, [canManageCourses, teacherData, teacherError]);

  // Determine loading state
  const isLoading =
    session.isPending ||
    isUserLoading ||
    (canManageCourses && isTeacherLoading);

  // Show loading state while data is being fetched
  if (isLoading || (canManageCourses && hasOrganization === null)) {
    return <CoursesPageSkeleton />;
  }

  // Nest user profile missing — still allow catalog for students; teachers need provisioning
  if (isUserError && canManageCourses) {
    return (
      <OrganizationRequirementMessage
        userRole={sessionRoles?.includes("admin") ? "admin" : "teacher"}
      />
    );
  }

  // Only render organization requirement if we have complete data and user is teacher/admin without organization
  if (canManageCourses && hasOrganization === false) {
    return (
      <OrganizationRequirementMessage
        userRole={userData?.role ?? "teacher"}
        organizationId={teacherData?.organizationId?.toString()}
      />
    );
  }

  // Show normal course dashboard for users with organization or non-teacher/admin users
  return <ModernCourseDashboard />;
}
