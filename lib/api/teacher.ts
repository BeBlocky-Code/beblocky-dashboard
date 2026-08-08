import type { ITeacher } from "@/types/teacher";
import type { IUser } from "@/types/user";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

async function teacherAuthHeaders(user: IUser) {
  const auth = await getApiAuthHeaders();
  return {
    ...auth,
    "x-user-id": user._id || user.email || "",
    "x-user-type": user.role || "teacher",
  };
}

async function parseError(response: Response): Promise<string> {
  const errorText = await response.text();
  try {
    const errorData = JSON.parse(errorText);
    return errorData.message || errorText || response.statusText;
  } catch {
    return errorText || response.statusText;
  }
}

export const teacherApi = {
  async createTeacherFromUser(userId: string, user: IUser): Promise<ITeacher> {
    const authHeaders = await teacherAuthHeaders(user);
    const response = await fetch(getApiUrl("/teachers/from-user"), {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(
        (await parseError(response)) ||
          `Failed to create teacher: ${response.status}`,
      );
    }

    return response.json();
  },

  async getTeacherByUserId(userId: string, user: IUser): Promise<ITeacher> {
    const authHeaders = await teacherAuthHeaders(user);
    const response = await fetch(getApiUrl(`/teachers/user/${userId}`), {
      headers: authHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Teacher not found");
      }
      throw new Error(
        (await parseError(response)) ||
          `Failed to get teacher: ${response.status}`,
      );
    }

    return response.json();
  },

  async getCurrentTeacher(user: IUser): Promise<ITeacher> {
    const userId = user._id || user.email;
    if (!userId) {
      throw new Error("User id is required to load teacher profile");
    }
    // Prefer the user-scoped route — /teacher/me is not a Nest route.
    return this.getTeacherByUserId(String(userId), user);
  },
};
