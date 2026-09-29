import type { IAdmin } from "@/types/admin";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";

export const adminApi = {
  async getAdminByUserId(userId: string, _user: IUser): Promise<IAdmin> {
    try {
      return await apiFetch<IAdmin>(`/admins/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Admin not found");
      }
      throw error;
    }
  },

  async getCurrentAdmin(user: IUser): Promise<IAdmin> {
    const userId = user._id || user.email;
    if (!userId) {
      throw new Error("User id is required to load admin profile");
    }
    // Prefer the user-scoped route — /admin/me is not a Nest route.
    return this.getAdminByUserId(String(userId), user);
  },
};
