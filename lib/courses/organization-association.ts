/**
 * Who may open the Courses catalog, and who must belong to a school first.
 *
 * A Teacher belongs to exactly one Organization. An Admin organizes the
 * product and does not need a school. An Organization Account is the school.
 */

export function accountRoles(
  sessionRoles: string[] | undefined,
  mongoRole: string | undefined,
): string[] {
  if (sessionRoles && sessionRoles.length > 0) {
    return [...sessionRoles];
  }
  if (mongoRole) {
    return [mongoRole];
  }
  return [];
}

/** Teachers belong to a school. Admin and Organization Accounts do not. */
export function teacherNeedsOrganization(roles: string[]): boolean {
  if (roles.includes("admin") || roles.includes("organization")) {
    return false;
  }
  return roles.includes("teacher");
}

function organizationIdOnTeacher(
  teacher: { organizationId?: unknown } | null | undefined,
): unknown {
  if (!teacher) {
    return undefined;
  }
  const row = teacher as Record<string, unknown>;
  return (
    teacher.organizationId ??
    row.organization_id ??
    row.organization ??
    row.orgId ??
    row.org_id
  );
}

export type CourseCatalogAccess = "allow" | "require-organization" | "pending";

export function courseCatalogAccess(input: {
  roles: string[];
  teacherLoading: boolean;
  teacher?: { organizationId?: unknown } | null;
  teacherError?: unknown;
}): CourseCatalogAccess {
  if (!teacherNeedsOrganization(input.roles)) {
    return "allow";
  }
  if (input.teacherLoading) {
    return "pending";
  }
  if (
    input.teacherError instanceof Error &&
    input.teacherError.message === "Teacher not found"
  ) {
    return "require-organization";
  }
  if (input.teacher) {
    return organizationIdOnTeacher(input.teacher)
      ? "allow"
      : "require-organization";
  }
  if (input.teacherError) {
    return "allow";
  }
  return "pending";
}
