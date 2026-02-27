"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Pencil, BookOpen } from "lucide-react";
import { useHourOfCode } from "@/lib/hooks/queries";
import type { HourOfCodeResponse, HourOfCodeCourse } from "@/lib/api/hour-of-code";
import { HourOfCodeCoursePicker } from "./hour-of-code-course-picker";
import { toast } from "sonner";

function isPopulatedCourse(c: HourOfCodeCourse | string): c is HourOfCodeCourse {
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
    toast.error(error instanceof Error ? error.message : "Failed to load Hour of Code");
  }

  return (
    <>
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  Hour of Code
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Courses shown in the Hour of Code section on the client app.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              Edit courses
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading...
            </div>
          ) : courseList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <BookOpen className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No courses assigned yet.
              </p>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
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
                  variant="secondary"
                  className="py-1.5 px-3 text-sm font-medium"
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
