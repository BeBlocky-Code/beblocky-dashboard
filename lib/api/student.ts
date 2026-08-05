import type { IStudent } from "@/types/student";
import type { IUser } from "@/types/user";
import { getApiAuthHeaders } from "@/lib/auth-client";

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

function fallbackStudent(userId: string, user?: IUser | null): IStudent {
  return {
    _id: userId,
    userId,
    dateOfBirth: new Date(),
    grade: 1,
    gender: "other" as any,
    enrolledCourses: [],
    coins: 0,
    codingStreak: 0,
    lastCodingActivity: new Date(),
    totalCoinsEarned: 0,
    totalTimeSpent: 0,
    goals: [],
    subscription: "free",
    section: "A",
    createdAt: new Date(),
    updatedAt: new Date(),
    name: user?.name,
    email: user?.email,
    displayName: user?.name || user?.email,
  };
}

export const studentApi = {
  async getStudentByEmail(email: string, user: IUser): Promise<IStudent> {
    try {
      const headers = await getApiAuthHeaders();
      const response = await fetch(
        getApiUrl(`/students/email/${encodeURIComponent(email)}`),
        {
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.warn(
          "Student API not available, creating default student object for email"
        );
        return fallbackStudent(email, user);
      }

      return response.json();
    } catch (error) {
      console.warn(
        "Student API error, creating default student object for email:",
        error
      );
      return fallbackStudent(email, user);
    }
  },

  async getStudentByUserId(userId: string, user: IUser): Promise<IStudent> {
    try {
      const headers = await getApiAuthHeaders();
      const response = await fetch(getApiUrl(`/students/user/${userId}`), {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        console.warn(
          "Student API not available, creating default student object"
        );
        return fallbackStudent(userId, user);
      }

      return response.json();
    } catch (error) {
      console.warn(
        "Student API error, creating default student object:",
        error
      );
      return fallbackStudent(userId, user);
    }
  },

  async getCurrentStudent(user: IUser): Promise<IStudent> {
    const userId = user._id || user.email;
    try {
      const headers = await getApiAuthHeaders();
      // Resolve via userId — /students/me is not a Nest route.
      const response = await fetch(getApiUrl(`/students/user/${userId}`), {
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        console.warn(
          "Student API not available, creating default student object"
        );
        return fallbackStudent(userId, user);
      }

      return response.json();
    } catch (error) {
      console.warn(
        "Student API error, creating default student object:",
        error
      );
      return fallbackStudent(userId, user);
    }
  },

  /**
   * Admin list. Goes through the app route so the httpOnly session cookie can
   * be forwarded as Bearer, and so name/email/displayName are normalized.
   */
  async getAllStudents(): Promise<IStudent[]> {
    const response = await fetch("/api/admin/students", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to load students: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },
};
