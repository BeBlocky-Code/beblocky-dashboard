"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CalendarX, UserX } from "lucide-react";

export interface IncompleteProfileStudent {
  id: string;
  name: string;
  identifier: string;
  missingDateOfBirth: boolean;
  missingGender: boolean;
}

interface IncompleteProfileNoticeProps {
  students: IncompleteProfileStudent[];
  totalStudents: number;
  /** Only auto-open once the underlying data has settled */
  ready?: boolean;
}

// Re-showing on every client navigation is noisy; once per tab is enough.
const SEEN_KEY = "beblocky-dashboard-incomplete-profiles-seen";

export function IncompleteProfileNotice({
  students,
  totalStudents,
  ready = true,
}: IncompleteProfileNoticeProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ready || students.length === 0) return;
    if (sessionStorage.getItem(SEEN_KEY)) return;
    sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(true);
  }, [ready, students.length]);

  if (students.length === 0) return null;

  const missingDob = students.filter((s) => s.missingDateOfBirth).length;
  const missingGender = students.filter((s) => s.missingGender).length;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {students.length} of {totalStudents} students have incomplete
              profiles
            </p>
            <p className="text-xs text-muted-foreground">
              {missingDob} missing date of birth · {missingGender} missing
              gender. Age and demographic analytics exclude them.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setOpen(true)}
        >
          Review
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-secondary" />
              Incomplete student profiles
            </DialogTitle>
            <DialogDescription>
              These students signed up without a date of birth or gender. Until
              they complete onboarding, they are excluded from age and gender
              analytics.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Badge
              variant="outline"
              className="border-secondary/40 text-secondary"
            >
              <CalendarX className="mr-1 h-3 w-3" />
              {missingDob} missing DOB
            </Badge>
            <Badge
              variant="outline"
              className="border-primary/40 text-primary"
            >
              <UserX className="mr-1 h-3 w-3" />
              {missingGender} missing gender
            </Badge>
          </div>

          <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/40 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.identifier}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {student.missingDateOfBirth && (
                    <Badge variant="secondary" className="text-[10px]">
                      No DOB
                    </Badge>
                  )}
                  {student.missingGender && (
                    <Badge variant="secondary" className="text-[10px]">
                      No gender
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
