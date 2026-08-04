export interface ICourseProgress {
  _id?: string;
  studentId: string;
  courseId: string;
  completionPercentage: number;
}

const getApiUrl = (endpoint: string) => {
  if (!process.env.NEXT_PUBLIC_API_URL) {
    throw new Error("API URL is not configured");
  }
  return `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;
};

function normalizeProgressRecord(record: Record<string, unknown>): ICourseProgress {
  const studentId =
    record.studentId != null
      ? String(record.studentId)
      : "";
  const courseId =
    record.courseId != null ? String(record.courseId) : "";

  return {
    _id: record._id != null ? String(record._id) : undefined,
    studentId,
    courseId,
    completionPercentage:
      typeof record.completionPercentage === "number"
        ? record.completionPercentage
        : 0,
  };
}

export const progressApi = {
  async getAllProgress(): Promise<ICourseProgress[]> {
    const response = await fetch(getApiUrl("/progress"), {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`Failed to load progress: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((record) =>
      normalizeProgressRecord(record as Record<string, unknown>)
    );
  },
};
