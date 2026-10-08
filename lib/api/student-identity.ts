/**
 * Admin student list path on Nest.
 * The browser must call this with Bearer. A Next.js proxy to the public API
 * hostname hairpins on the shared host and returns 502.
 */
export const ADMIN_STUDENT_LIST_PATH = "/students";

export type StudentIdentityFields = {
  userId?: string;
  name?: string;
  email?: string;
  displayName?: string;
};

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

/** Fill name/email/displayName when auth-service left blanks. */
export function withIdentity<T extends StudentIdentityFields>(
  student: T,
): T & { displayName: string; name?: string; email?: string } {
  const userId = String(student.userId ?? "").trim();
  const name =
    typeof student.name === "string" && student.name.trim()
      ? student.name.trim()
      : undefined;
  const email =
    typeof student.email === "string" && student.email.trim()
      ? student.email.trim()
      : undefined;
  const displayName =
    (typeof student.displayName === "string" && student.displayName.trim()) ||
    name ||
    email ||
    (userId ? `Student ${shortId(userId)}` : "Student");

  return {
    ...student,
    name,
    email,
    displayName,
  };
}
