"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteCourseConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseTitle: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteCourseConfirmationDialog({
  open,
  onOpenChange,
  courseTitle,
  onConfirm,
  isLoading = false,
}: DeleteCourseConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setConfirmationText("");
      setIsConfirmed(false);
      setCopied(false);
    }
  }, [open]);

  const handleCopyCourseTitle = async () => {
    try {
      await navigator.clipboard.writeText(courseTitle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy course title:", error);
    }
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationText(value);
    // Trim whitespace and normalize comparison
    const normalizedInput = value.trim().toLowerCase();
    const normalizedCourseTitle = courseTitle.trim().toLowerCase();
    const isMatch = normalizedInput === normalizedCourseTitle;

    console.log("Confirmation Debug:", {
      input: value,
      inputLength: value.length,
      normalizedInput,
      normalizedInputLength: normalizedInput.length,
      courseTitle,
      courseTitleLength: courseTitle.length,
      normalizedCourseTitle,
      normalizedCourseTitleLength: normalizedCourseTitle.length,
      isMatch,
      inputCharCodes: [...value].map((c) => c.charCodeAt(0)),
      courseTitleCharCodes: [...courseTitle].map((c) => c.charCodeAt(0)),
    });

    setIsConfirmed(isMatch);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      // Reset state after confirmation
      setConfirmationText("");
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setConfirmationText("");
    setIsConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm shadow-sm">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-destructive">
                Delete Course
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Warning: This will permanently delete the course
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All lessons and slides will be removed</li>
                  <li>• Student enrollments will be lost</li>
                  <li>• Course data cannot be recovered</li>
                  <li>• All progress and analytics will be deleted</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmation-text">
                Type{" "}
                <span className="font-mono font-bold text-destructive rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1">
                  "{courseTitle}"
                </span>{" "}
                to confirm
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCourseTitle}
                disabled={copied}
                className="h-8 rounded-full border-border/40 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Input
              id="confirmation-text"
              type="text"
              placeholder={`Type "${courseTitle}" to confirm deletion`}
              value={confirmationText}
              onChange={(e) => handleConfirmationChange(e.target.value)}
              className={cn(
                "border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20",
                isConfirmed &&
                  "border-emerald-500/40 focus:border-emerald-500/40 bg-emerald-500/10",
                !isConfirmed &&
                  confirmationText &&
                  "border-destructive/40 focus:border-destructive/40 bg-destructive/10"
              )}
              disabled={isLoading}
            />
            {confirmationText && !isConfirmed && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <span>
                  Course title does not match. Please type exactly:
                </span>
                <span className="font-mono font-bold rounded-full border border-destructive/30 bg-destructive/10 px-2 py-1">
                  "{courseTitle}"
                </span>
              </p>
            )}
            {isConfirmed && (
              <p className="text-sm text-emerald-600 flex items-center gap-2">
                <span>
                  Course title matches. You can now delete the course.
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="rounded-full border-border/40">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
