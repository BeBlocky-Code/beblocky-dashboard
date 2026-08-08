import type {
  IClass,
  ICreateClassDto,
  IUpdateClassDto,
  IAddStudentDto,
  IAddCourseDto,
  IClassStats,
} from "@/types/class";
import type { IUser } from "@/types/user";
import type { ITeacher } from "@/types/teacher";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}/classes${endpoint}`;
};

async function classAuthHeaders(user: IUser) {
  const auth = await getApiAuthHeaders();
  return {
    ...auth,
    "x-user-id": user._id || user.email || "",
    "x-user-type": user.role || "",
  };
}

export const classApi = {
  // Class CRUD operations
  async createClass(data: ICreateClassDto, user: IUser): Promise<IClass> {
    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(""), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create class: ${response.status} ${errorText}`,
      );
    }

    return response.json();
  },

  async getClasses(
    user: IUser,
    filters?: {
      creatorId?: string;
      organizationId?: string;
      courseId?: string;
      studentId?: string;
      userType?: string;
    },
  ): Promise<IClass[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }

    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(`?${params}`), {
      headers: authHeaders,
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch classes: ${response.status} ${errorText}`,
      );
    }

    return response.json();
  },

  async getClassById(id: string, user: IUser): Promise<IClass> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${id}`), {
        headers: authHeaders,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);

        // Parse error response if it's JSON
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          errorData.message || `Failed to get class: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Class retrieved successfully:", result);
      return result;
    } catch (error) {
      console.error("Class API error:", error);
      throw error; // Re-throw the error instead of returning mock data
    }
  },

  async updateClass(
    id: string,
    data: IUpdateClassDto,
    user: IUser
  ): Promise<IClass> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${id}`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);

        // Parse error response if it's JSON
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          errorData.message || `Failed to update class: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("Class updated successfully:", result);
      return result;
    } catch (error) {
      console.error("Class API error:", error);
      throw error; // Re-throw the error instead of returning mock data
    }
  },

  async deleteClass(id: string, user: IUser): Promise<void> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${id}`), {
        method: "DELETE",
        headers: authHeaders,
        credentials: "include",
      });

    if (!response.ok) {
      throw new Error(
        `Failed to delete class: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("Class API error deleting class:", error);
    throw error;
  }
  },

  // Student management
  async addStudent(
    classId: string,
    data: IAddStudentDto,
    user: IUser
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${classId}/add-student`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `Failed to add student: ${response.status} ${response.statusText}`,
            error: "Bad Request",
            statusCode: response.status,
          };
        }

        // Return structured error response
        return {
          success: false,
          error: errorData,
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Class API error adding student:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to add student",
        },
      };
    }
  },

  async removeStudent(
    classId: string,
    studentId: string,
    user: IUser
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${classId}/remove-student`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify({ studentId }),
      });

      if (!response.ok) {
        // Parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `Failed to remove student: ${response.status} ${response.statusText}`,
            error: "Bad Request",
            statusCode: response.status,
          };
        }

        // Return structured error response
        return {
          success: false,
          error: errorData,
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Class API error removing student:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to remove student",
        },
      };
    }
  },

  // Course management
  async addCourse(
    classId: string,
    data: IAddCourseDto,
    user: IUser
  ): Promise<IClass> {
    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(`/${classId}/add-course`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to add course");
    return response.json();
  },

  async removeCourse(
    classId: string,
    courseId: string,
    user: IUser
  ): Promise<IClass> {
    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(`/${classId}/remove-course`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify({ courseId }),
    });
    if (!response.ok) throw new Error("Failed to remove course");
    return response.json();
  },

  // Class settings and management
  async updateSettings(
    classId: string,
    settings: {
      allowStudentEnrollment?: boolean;
      requireApproval?: boolean;
      autoProgress?: boolean;
    },
    user: IUser
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const authHeaders = await classAuthHeaders(user);
      const response = await fetch(getApiUrl(`/${classId}/settings`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        // Parse error response
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            message: `Failed to update settings: ${response.status} ${response.statusText}`,
            error: "Bad Request",
            statusCode: response.status,
          };
        }

        // Return structured error response
        return {
          success: false,
          error: errorData,
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("Class API error updating settings:", error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Failed to update settings",
        },
      };
    }
  },

  async extendEndDate(
    classId: string,
    newEndDate: Date,
    user: IUser
  ): Promise<IClass> {
    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(`/${classId}/extend`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      credentials: "include",
      body: JSON.stringify({ endDate: newEndDate }),
    });
    if (!response.ok) throw new Error("Failed to extend class");
    return response.json();
  },

  // Statistics
  async getClassStats(classId: string, user: IUser): Promise<IClassStats> {
    const authHeaders = await classAuthHeaders(user);
    const response = await fetch(getApiUrl(`/${classId}/stats`), {
      headers: authHeaders,
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch class stats");
    return response.json();
  },
};
