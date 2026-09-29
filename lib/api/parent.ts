import type { IParent } from "@/types/parent";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";

export const parentApi = {
  async getParentByUserId(userId: string, _user: IUser): Promise<IParent> {
    try {
      return await apiFetch<IParent>(`/parents/user/${userId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error("Parent not found");
      }
      throw error;
    }
  },

  async getCurrentParent(user: IUser): Promise<IParent> {
    const userId = user._id || user.email;
    if (!userId) {
      throw new Error("User id is required to load parent profile");
    }
    // Prefer the user-scoped route — /parent/me is not a Nest route.
    return this.getParentByUserId(String(userId), user);
  },
};
