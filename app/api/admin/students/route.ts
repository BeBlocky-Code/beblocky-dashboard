import { NextRequest, NextResponse } from "next/server";
import { normalizeSessionToken } from "@/lib/auth-callback";

type StudentIdentity = {
  userId?: string;
  name?: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
};

function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

/**
 * Ensure list rows always expose the identity fields the admin UI expects.
 * Upstream GET /students already resolves name/email from auth-service; this
 * normalizes blanks and adds a stable displayName fallback.
 */
function withIdentity(student: StudentIdentity): StudentIdentity {
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

/**
 * Server-side proxy for the admin student list.
 *
 * The student list carries name/email resolved from auth-service, so the API
 * endpoint requires a session. The session cookie is httpOnly and host-only,
 * meaning the browser never sends it to the API origin — this handler reads it
 * and forwards it as a bearer token instead.
 */
export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json(
      { message: "API URL is not configured" },
      { status: 500 }
    );
  }

  const token = normalizeSessionToken(
    request.cookies.get("session")?.value ||
      request.cookies.get("__Secure-session")?.value ||
      request.cookies.get("__Host-session")?.value
  );
  if (!token) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/students`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json(
      { message: `Failed to load students: ${response.status}` },
      { status: response.status }
    );
  }

  const data = await response.json();
  const students = Array.isArray(data) ? data.map(withIdentity) : [];
  return NextResponse.json(students);
}
