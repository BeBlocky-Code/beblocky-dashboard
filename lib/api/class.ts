import type {
  IClass,
  ICreateClassDto,
  IUpdateClassDto,
  IAddStudentDto,
  IAddCourseDto,
  IClassStats,
} from "@/types/class";
import type { IUser } from "@/types/user";
import { apiFetch, ApiError } from "@/lib/api/utils";

export const classApi = {
  // Class CRUD operations
  async createClass(data: ICreateClassDto, _user?: IUser): Promise<IClass> {
    return apiFetch<IClass>("/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async getClasses(
    _user: IUser,
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

    const qs = params.toString();
    return apiFetch<IClass[]>(`/classes${qs ? `?${qs}` : ""}`);
  },

  async getClassById(id: string, _user: IUser): Promise<IClass> {
    return apiFetch<IClass>(`/classes/${id}`);
  },

  async updateClass(
    id: string,
    data: IUpdateClassDto,
    _user: IUser,
  ): Promise<IClass> {
    return apiFetch<IClass>(`/classes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async deleteClass(id: string, _user: IUser): Promise<void> {
    await apiFetch<void>(`/classes/${id}`, {
      method: "DELETE",
    });
  },

  // Student management
  async addStudent(
    classId: string,
    data: IAddStudentDto,
    _user: IUser,
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const result = await apiFetch<IClass>(`/classes/${classId}/add-student`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error("Class API error adding student:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            message: error.message,
            error: "Bad Request",
            statusCode: error.status,
          },
        };
      }
      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : "Failed to add student",
        },
      };
    }
  },

  async removeStudent(
    classId: string,
    studentId: string,
    _user: IUser,
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const result = await apiFetch<IClass>(
        `/classes/${classId}/remove-student`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId }),
        },
      );
      return { success: true, data: result };
    } catch (error) {
      console.error("Class API error removing student:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            message: error.message,
            error: "Bad Request",
            statusCode: error.status,
          },
        };
      }
      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to remove student",
        },
      };
    }
  },

  // Course management
  async addCourse(
    classId: string,
    data: IAddCourseDto,
    _user: IUser,
  ): Promise<IClass> {
    return apiFetch<IClass>(`/classes/${classId}/add-course`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  async removeCourse(
    classId: string,
    courseId: string,
    _user: IUser,
  ): Promise<IClass> {
    return apiFetch<IClass>(`/classes/${classId}/remove-course`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
  },

  // Class settings and management
  async updateSettings(
    classId: string,
    settings: {
      allowStudentEnrollment?: boolean;
      requireApproval?: boolean;
      autoProgress?: boolean;
    },
    _user: IUser,
  ): Promise<{ success: boolean; data?: IClass; error?: any }> {
    try {
      const result = await apiFetch<IClass>(`/classes/${classId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      return { success: true, data: result };
    } catch (error) {
      console.error("Class API error updating settings:", error);
      if (error instanceof ApiError) {
        return {
          success: false,
          error: {
            message: error.message,
            error: "Bad Request",
            statusCode: error.status,
          },
        };
      }
      return {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update settings",
        },
      };
    }
  },

  async extendEndDate(
    classId: string,
    newEndDate: Date,
    _user: IUser,
  ): Promise<IClass> {
    return apiFetch<IClass>(`/classes/${classId}/extend`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endDate: newEndDate }),
    });
  },

  // Statistics
  async getClassStats(classId: string, _user: IUser): Promise<IClassStats> {
    return apiFetch<IClassStats>(`/classes/${classId}/stats`);
  },

  /** Standing for enrolled learners in Class Courses (no saved code). */
  async getClassStanding(classId: string): Promise<
    Array<{
      learnerId: string;
      standings: Array<{
        courseId: string;
        percentage: number;
        completedLessonCount: number;
        totalLessons: number;
        coinsEarned: number;
      }>;
    }>
  > {
    return apiFetch(`/classes/${classId}/standing`);
  },
};
