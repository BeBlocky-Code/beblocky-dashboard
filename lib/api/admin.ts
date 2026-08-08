import type { IAdmin } from "@/types/admin";
import type { IUser } from "@/types/user";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

async function adminAuthHeaders(user: IUser) {
  const auth = await getApiAuthHeaders();
  return {
    ...auth,
    "x-user-id": user._id || user.email || "",
    "x-user-type": user.role || "admin",
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

export const adminApi = {
  async getAdminByUserId(userId: string, user: IUser): Promise<IAdmin> {
    const authHeaders = await adminAuthHeaders(user);
    const response = await fetch(getApiUrl(`/admins/user/${userId}`), {
      headers: authHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Admin not found");
      }
      throw new Error(
        (await parseError(response)) ||
          `Failed to get admin: ${response.status}`,
      );
    }

    return response.json();
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
