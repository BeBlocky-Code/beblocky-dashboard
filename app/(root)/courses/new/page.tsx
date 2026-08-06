"use client";

import { CourseWorkspace } from "@/components/courses/workspace/course-workspace";

export default function NewCoursePage() {
  return (
    <div className="pt-2">
      <CourseWorkspace mode="create" />
    </div>
  );
}
