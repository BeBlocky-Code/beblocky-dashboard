import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

async function parseError(response: Response): Promise<string> {
  const errorText = await response.text();
  try {
    const errorData = JSON.parse(errorText);
    return errorData.message || errorText || response.statusText;
  } catch {
    return errorText || response.statusText;
  }
}

export const studentApi = {
  async getStudentByEmail(email: string, _user: IUser): Promise<IStudent> {
    const headers = await getApiAuthHeaders();
    const response = await fetch(
      getApiUrl(`/students/email/${encodeURIComponent(email)}`),
      {
        headers,
        credentials: "include",
      },
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Student not found");
      }
      throw new Error(
        (await parseError(response)) ||
          `Failed to get student by email: ${response.status}`,
      );
    }

    return response.json();
  },

  async getStudentByUserId(userId: string, _user: IUser): Promise<IStudent> {
    const headers = await getApiAuthHeaders();
    const response = await fetch(getApiUrl(`/students/user/${userId}`), {
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Student not found");
      }
      throw new Error(
        (await parseError(response)) ||
          `Failed to get student: ${response.status}`,
      );
    }

    return response.json();
  },

  async getCurrentStudent(user: IUser): Promise<IStudent> {
    const userId = user._id || user.email;
    if (!userId) {
      throw new Error("User id is required to load student profile");
    }
    return this.getStudentByUserId(String(userId), user);
  },

  /**
   * Admin list. Goes through the app route so the httpOnly session cookie can
   * be forwarded as Bearer, and so name/email/displayName are normalized.
   */
  async getAllStudents(): Promise<IStudent[]> {
    const response = await fetch("/api/admin/students", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to load students: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
};
