import type { IOrganization } from "@/types/organization";
import type { IUser } from "@/types/user";
import { Types } from "mongoose";
import { apiFetch, ApiError } from "@/lib/api/utils";

function defaultOrganization(user: IUser, userId?: string): IOrganization {
  return {
    _id: userId || user._id || "default",
    name: "Default Organization",
    type: "school" as any,
    status: "active" as any,
    description: "Default organization",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",
    },
    contactInfo: {
      email: user.email,
      phone: "",
      contactPerson: user.name,
    },
    subscription: new Types.ObjectId(),
    teachers: [],
    students: [],
    courses: [],
    classes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const organizationApi = {
  async getOrganizationByUserId(
    userId: string,
    user: IUser,
  ): Promise<IOrganization> {
    try {
      return await apiFetch<IOrganization>(`/organization/user/${userId}`);
    } catch (error) {
      console.warn(
        "Organization API unavailable, using default organization object:",
        error instanceof ApiError ? error.message : error,
      );
      return defaultOrganization(user, userId);
    }
  },

  async getCurrentOrganization(user: IUser): Promise<IOrganization> {
    try {
      return await apiFetch<IOrganization>("/organization/me");
    } catch (error) {
      console.warn(
        "Organization API unavailable, using default organization object:",
        error instanceof ApiError ? error.message : error,
      );
      return defaultOrganization(user);
    }
  },

  async list(): Promise<IOrganization[]> {
    const data = await apiFetch<IOrganization[] | { data: IOrganization[] }>(
      "/organizations",
    );
    return Array.isArray(data) ? data : data.data ?? [];
  },
};
