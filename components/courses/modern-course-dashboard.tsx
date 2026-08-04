"use client";

import { useRouter } from "next/navigation";
import { ModernCourseGrid } from "./modern-course-grid";
import { ModernCourseStats } from "./modern-course-stats";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ModernCourseDashboard() {
  const router = useRouter();

  return (
    <div className="min-h-full bg-muted/10">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Courses
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track your educational content
            </p>
          </div>
          <Button
            className="h-10 rounded-full px-5 text-xs font-bold shadow-sm"
            onClick={() => router.push("/courses/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            New course
          </Button>
        </div>

        <div className="mb-8">
          <ModernCourseStats />
        </div>

        <ModernCourseGrid />
      </div>
    </div>
  );
}
