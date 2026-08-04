"use client";

import { CourseWorkspace } from "./workspace/course-workspace";

/**
 * @deprecated Prefer CourseWorkspace directly.
 * Thin wrapper kept for any lingering imports.
 */
export function ModernCourseEditor({
  courseId,
}: {
  courseId: string;
  onCourseCreated?: () => void;
}) {
  return <CourseWorkspace mode="edit" courseId={courseId} />;
}
