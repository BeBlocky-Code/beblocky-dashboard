"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Loader2 } from "lucide-react";
import { useCoursesWithDetails, usePatchHourOfCode } from "@/lib/hooks/queries";
import type { HourOfCodeResponse, HourOfCodeCourse } from "@/lib/api/hour-of-code";
import type { ClientCourse } from "@/lib/api/course";
import { toast } from "sonner";

function isPopulatedCourse(c: HourOfCodeCourse | string): c is HourOfCodeCourse {
  return typeof c === "object" && c !== null && "_id" in c;
}

interface HourOfCodeCoursePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentHourOfCode?: HourOfCodeResponse | null;
}

export function HourOfCodeCoursePicker({
  open,
  onOpenChange,
  currentHourOfCode,
}: HourOfCodeCoursePickerProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    const ids = currentHourOfCode?.courseIds ?? [];
    const initial = new Set<string>();
    ids.forEach((c) => {
      if (typeof c === "string") initial.add(c);
      else if (c && typeof c === "object" && "_id" in c) initial.add((c as HourOfCodeCourse)._id);
    });
    setSelectedIds(initial);
  }, [open, currentHourOfCode]);

  const { data: courses = [], isLoading: coursesLoading } = useCoursesWithDetails();
  const patchMutation = usePatchHourOfCode();

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c: ClientCourse) =>
        c.courseTitle?.toLowerCase().includes(q) ||
        c.courseDescription?.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const handleToggle = (courseId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await patchMutation.mutateAsync({
        courseIds: Array.from(selectedIds),
      });
      toast.success("Hour of Code courses updated.");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>Edit Hour of Code courses</DialogTitle>
        </DialogHeader>

        <div className="relative py-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="max-h-[280px] overflow-y-auto space-y-2 rounded-md border border-slate-200 dark:border-slate-700 p-2">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading courses...
            </div>
          ) : filteredCourses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No courses match.
            </p>
          ) : (
            filteredCourses.map((course: ClientCourse) => (
              <label
                key={course._id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.has(course._id)}
                  onCheckedChange={() => handleToggle(course._id)}
                />
                <span className="text-sm font-medium truncate flex-1">
                  {course.courseTitle}
                </span>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={patchMutation.isPending}>
            {patchMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
