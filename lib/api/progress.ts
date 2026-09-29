import { apiFetch } from "@/lib/api/utils";

export interface ICourseProgress {
  _id?: string;
  studentId: string;
  courseId: string;
  completionPercentage: number;
}

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
    const data = await apiFetch<unknown[]>("/progress");
    if (!Array.isArray(data)) return [];

    return data.map((record) =>
      normalizeProgressRecord(record as Record<string, unknown>)
    );
  },
};
