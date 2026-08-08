import type { IParent } from "@/types/parent";
import type { IUser } from "@/types/user";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

async function parentAuthHeaders(user: IUser) {
  const auth = await getApiAuthHeaders();
  return {
    ...auth,
    "x-user-id": user._id || user.email || "",
    "x-user-type": user.role || "parent",
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

export const parentApi = {
  async getParentByUserId(userId: string, user: IUser): Promise<IParent> {
    const authHeaders = await parentAuthHeaders(user);
    const response = await fetch(getApiUrl(`/parents/user/${userId}`), {
      headers: authHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Parent not found");
      }
      throw new Error(
        (await parseError(response)) ||
          `Failed to get parent: ${response.status}`,
      );
    }

    return response.json();
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
