const LEARNER_ROLES = ["student", "parent"] as const;
const STAFF_ROLES = ["teacher", "admin", "organization"] as const;

export const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://code.beblocky.com"
    : "http://localhost:3002");

export function hasLearnerRole(roles: string[]): boolean {
  return roles.some((role) =>
    LEARNER_ROLES.includes(role as (typeof LEARNER_ROLES)[number]),
  );
}

export function hasStaffRole(roles: string[]): boolean {
  return roles.some((role) =>
    STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]),
  );
}

/** Student/Parent-only Accounts belong on the client, not this dashboard. */
export function shouldLeaveDashboard(roles: string[]): boolean {
  return hasLearnerRole(roles) && !hasStaffRole(roles);
}

/**
 * Session-dependent chrome must wait until the client has mounted.
 * Otherwise SSR (pending session) and the hydrated client (cached session)
 * render different trees.
 */
export function isWorkspaceSessionReady(
  hasMounted: boolean,
  isPending: boolean,
): boolean {
  return hasMounted && !isPending;
}

export function primaryRoleLabel(roles: string[]): string {
  if (roles.includes("parent")) return "Parent";
  if (roles.includes("student")) return "Student";
  if (roles.includes("teacher")) return "Teacher";
  if (roles.includes("organization")) return "Organization";
  if (roles.includes("admin")) return "Admin";
  return "Account";
}
