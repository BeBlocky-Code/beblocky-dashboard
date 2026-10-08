import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";
import {
  ADMIN_STUDENT_LIST_PATH,
  withIdentity,
} from "@/lib/api/student-identity";

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
   * Admin list. Browser → Nest with Bearer, same as Courses.
   * Do not proxy this through Next.js: the public API hostname hairpins
   * from the dashboard container and returns 502.
   */
  async getAllStudents(): Promise<IStudent[]> {
    try {
      const data = await apiFetch<IStudent[]>(ADMIN_STUDENT_LIST_PATH);
      const rows = Array.isArray(data) ? data : [];
      return rows.map(withIdentity);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(`Failed to load students: ${error.status}`);
      }
      throw error;
    }
  },
};
