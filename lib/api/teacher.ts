import type { ITeacher } from "@/types/teacher";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";

export const teacherApi = {
  async createTeacherFromUser(userId: string, _user: IUser): Promise<ITeacher> {
    return apiFetch<ITeacher>("/teachers/from-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  },

  async getTeacherByUserId(userId: string, _user: IUser): Promise<ITeacher> {
    try {
      return await apiFetch<ITeacher>(`/teachers/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Teacher not found");
      }
      throw error;
    }
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
