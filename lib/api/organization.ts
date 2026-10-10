import type { IOrganization } from "@/types/organization";
import type { IUser } from "@/types/user";
import { ObjectId } from "@/lib/object-id";
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
    subscription: new ObjectId(),
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

  async byAccount(accountId: string): Promise<IOrganization> {
    return apiFetch<IOrganization>(`/organizations/user/${accountId}`);
  },

  async list(): Promise<IOrganization[]> {
    const data = await apiFetch<IOrganization[] | { data: IOrganization[] }>(
      "/organizations",
    );
    return Array.isArray(data) ? data : data.data ?? [];
  },

  async createSchool(name: string, email: string): Promise<IOrganization> {
    return apiFetch<IOrganization>("/organizations/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  },

  async inviteTeacher(
    organizationId: string,
    teacherId: string,
  ): Promise<unknown> {
    return apiFetch(`/organizations/${organizationId}/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId }),
    });
  },

  async school(organizationId: string): Promise<{
    id: string;
    name: string;
    teachers: Array<{ id: string; accountId: string }>;
    roster: string[];
    courses: string[];
    classes: Array<{ id: string; name: string }>;
  }> {
    return apiFetch(`/organizations/${organizationId}/school`);
  },
};
