"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Pencil, BookOpen } from "lucide-react";
import { useHourOfCode } from "@/lib/hooks/queries";
import type { HourOfCodeCourse } from "@/lib/api/hour-of-code";
import { HourOfCodeCoursePicker } from "./hour-of-code-course-picker";
import { toast } from "sonner";

function isPopulatedCourse(
  c: HourOfCodeCourse | string
): c is HourOfCodeCourse {
  return typeof c === "object" && c !== null && "_id" in c;
}

export function HourOfCodeSection() {
  const { data: hourOfCode, isLoading, error } = useHourOfCode();
  const [pickerOpen, setPickerOpen] = useState(false);

  const courses = hourOfCode?.courseIds ?? [];
  const courseList = Array.isArray(courses)
    ? courses.filter(isPopulatedCourse)
    : [];

  if (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to load Hour of Code"
    );
  }

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Hour of Code</CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Courses shown in the Hour of Code section on the client app
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="h-9 rounded-full border-border/60 px-4 text-xs font-bold"
            >
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit courses
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              Loading…
            </div>
          ) : courseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No courses assigned yet
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={() => setPickerOpen(true)}
              >
                Add courses
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {courseList.map((course) => (
                <Badge
                  key={course._id}
                  variant="outline"
                  className="rounded-full border-border/40 bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {course.courseTitle ?? course._id}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <HourOfCodeCoursePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentHourOfCode={hourOfCode ?? undefined}
      />
    </>
  );
}
