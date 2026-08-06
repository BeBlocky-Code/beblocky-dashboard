import type { IUser } from "@/types/user";
import { UserRole } from "@/types/user";

// Use the standard API URL pattern like other APIs
const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}/users${endpoint}`;
};

// Helper function to get auth headers from user data
const getAuthHeaders = (user: Pick<IUser, "_id" | "email" | "role">) => {
  return {
    "x-user-id": user._id || user.email,
    "x-user-type": user.role || "student",
  };
};

export const userApi = {
  // Get every user record (admin views join these onto role documents by userId)
  async getAllUsers(): Promise<IUser[]> {
    const response = await fetch(getApiUrl(""), {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to load users: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // Get user by email from Nest (role-specific app profile). Throws on 404.
  async getUserByEmail(email: string): Promise<IUser> {
    const basicUser: Pick<IUser, "_id" | "email" | "role"> = {
      _id: email,
      email,
      role: UserRole.STUDENT,
    };

    const response = await fetch(
      getApiUrl(`/by-email?email=${encodeURIComponent(email)}`),
      {
        headers: getAuthHeaders(basicUser),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 404) {
        throw new Error("User not found");
      }
      throw new Error(
        errorText || `Failed to get user by email: ${response.status}`
      );
    }

    return response.json();
  },

  // Get current user profile
  async getCurrentUser(user: IUser): Promise<IUser> {
    const authHeaders = getAuthHeaders(user);
    const response = await fetch(getApiUrl("/me"), {
      headers: authHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.status}`);
    }

    return response.json();
  },
};
