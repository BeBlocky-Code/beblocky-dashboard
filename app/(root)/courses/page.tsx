"use client";

import { useSession } from "@/lib/auth-client";
import {
  useUserByEmail,
  useTeacherByUserId,
  useCoursesWithDetails,
} from "@/lib/hooks/queries";
import ModernCourseDashboard from "@/components/courses/modern-course-dashboard";
import { OrganizationRequirementMessage } from "@/components/courses/organization-requirement-message";
import { CoursesPageSkeleton } from "@/components/skeletons";
import {
  accountRoles,
  courseCatalogAccess,
  teacherNeedsOrganization,
} from "@/lib/courses/organization-association";

export default function CoursesPage() {
  const session = useSession();
  const email = session.data?.user?.email;
  const sessionUserId = session.data?.user?.id;
  const sessionRoles = session.data?.user?.roles;

  // Warm the course list while we resolve org membership — same query
  // ModernCourseGrid reads after the gate.
  useCoursesWithDetails();

  const {
    data: userData,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useUserByEmail(email, {
    enabled: !session.isPending && !!email,
  });

  const roles = accountRoles(sessionRoles, userData?.role);
  const needsOrganization = teacherNeedsOrganization(roles);

  const {
    data: teacherData,
    isLoading: isTeacherLoading,
    error: teacherError,
  } = useTeacherByUserId(sessionUserId, userData ?? null, {
    enabled: !session.isPending && !!sessionUserId && needsOrganization,
  });

  const access = courseCatalogAccess({
    roles,
    teacherLoading: isTeacherLoading,
    teacher: teacherData,
    teacherError,
  });

  const isLoading =
    session.isPending ||
    (!sessionRoles?.length && isUserLoading && !isUserError) ||
    (needsOrganization && isTeacherLoading);

  if (isLoading || access === "pending") {
    return <CoursesPageSkeleton />;
  }

  if (access === "require-organization") {
    return (
      <OrganizationRequirementMessage
        organizationId={teacherData?.organizationId?.toString()}
      />
    );
  }

  return <ModernCourseDashboard />;
}
