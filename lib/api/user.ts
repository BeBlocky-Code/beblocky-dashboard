import type { IUser } from "@/types/user";
import { apiFetch } from "@/lib/api/utils";

export const userApi = {
  // Get every user record (admin views join these onto role documents by userId)
  async getAllUsers(): Promise<IUser[]> {
    const data = await apiFetch<IUser[]>("/users");
    return Array.isArray(data) ? data : [];
  },

  // Get user by email from Nest (role-specific app profile). Throws on 404.
  async getUserByEmail(email: string): Promise<IUser> {
    return apiFetch<IUser>(
      `/users/by-email?email=${encodeURIComponent(email)}`,
    );
  },

  // Get current user profile
  async getCurrentUser(_user?: IUser): Promise<IUser> {
    return apiFetch<IUser>("/users/me");
  },
};
