import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";

export const studentApi = {
  async getStudentByEmail(email: string, _user: IUser): Promise<IStudent> {
    try {
      return await apiFetch<IStudent>(
        `/students/email/${encodeURIComponent(email)}`,
      );
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Student not found");
      }
      throw error;
    }
  },

  async getStudentByUserId(userId: string, _user: IUser): Promise<IStudent> {
    try {
      return await apiFetch<IStudent>(`/students/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Student not found");
      }
      throw error;
    }
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
