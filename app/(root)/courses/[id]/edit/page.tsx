"use client";

import { use } from "react";
import { CourseWorkspace } from "@/components/courses/workspace/course-workspace";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CourseEditPage({ params }: PageProps) {
  const { id: courseId } = use(params);

  if (!courseId) {
    notFound();
  }

  return (
    <div className="pt-2">
      <CourseWorkspace mode="edit" courseId={courseId} />
    </div>
  );
}
