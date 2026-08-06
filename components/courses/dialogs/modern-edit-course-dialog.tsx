"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Globe, Crown, Star, Users, Save } from "lucide-react";
import { motion } from "framer-motion";
import { CourseSubscriptionType, CourseStatus } from "@/types/course";
import {
  updateCourse,
  convertFromModernCourse,
  convertToModernCourse,
  type ModernCourse,
  type ClientCourse,
} from "@/lib/api/course";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface ModernEditCourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: ClientCourse;
  onComplete: (course: ClientCourse) => void;
}

export function ModernEditCourseDialog({
  open,
  onOpenChange,
  course,
  onComplete,
}: ModernEditCourseDialogProps) {
  const session = useSession();
  const [formData, setFormData] = useState<ModernCourse>(
    convertToModernCourse(course)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && course) {
      setFormData(convertToModernCourse(course));
      setError("");
    }
  }, [course, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!session.data?.user?.id) {
        throw new Error("User not authenticated");
      }

      // Convert form data back to API format
      const updateData = convertFromModernCourse(formData);

      // Call the API to update the course
      const updatedCourse = await updateCourse(
        course._id,
        updateData,
        session.data.user.id
      );

      onComplete(updatedCourse);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to update course:", err);
      setError(err instanceof Error ? err.message : "Failed to update course");
    } finally {
      setIsLoading(false);
    }
  };

  const getSubTypeIcon = (subType: CourseSubscriptionType) => {
    switch (subType) {
      case CourseSubscriptionType.PRO:
        return <Crown className="h-4 w-4" />;
      case CourseSubscriptionType.BUILDER:
        return <Star className="h-4 w-4" />;
      case CourseSubscriptionType.STARTER:
        return <Users className="h-4 w-4" />;
      case CourseSubscriptionType.ORGANIZATION:
        return <Users className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSubTypeColor = (subType: CourseSubscriptionType) => {
    switch (subType) {
      case CourseSubscriptionType.PRO:
        return "border-primary/40 bg-primary/10 text-primary";
      case CourseSubscriptionType.STARTER:
        return "border-secondary/40 bg-secondary/10 text-secondary";
      case CourseSubscriptionType.BUILDER:
        return "border-primary/40 bg-muted/30 text-primary";
      case CourseSubscriptionType.ORGANIZATION:
        return "border-secondary/40 bg-muted/30 text-secondary";
      default:
        return "border-border/40 bg-muted/30 text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm shadow-sm">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold tracking-tight">
            Edit Course Details
          </DialogTitle>
          <p className="text-muted-foreground">
            Update your course information and settings
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="courseTitle"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Course Title
                  </Label>
                  <Input
                    id="courseTitle"
                    value={formData.courseTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, courseTitle: e.target.value })
                    }
                    placeholder="Enter course title"
                    className="mt-2 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="courseDescription"
                    className="text-sm font-medium"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="courseDescription"
                    value={formData.courseDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        courseDescription: e.target.value,
                      })
                    }
                    placeholder="Describe your course"
                    rows={4}
                    className="mt-2 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="courseLanguage"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4" />
                      Language
                    </Label>
                    <Select
                      value={formData.courseLanguage}
                      onValueChange={(value) =>
                        setFormData({ ...formData, courseLanguage: value })
                      }
                    >
                      <SelectTrigger className="mt-2 border-border/40 bg-card/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="Python">Python</SelectItem>
                        <SelectItem value="Javascript">Javascript</SelectItem>
                        <SelectItem value="Typescript">Typescript</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          status: value as "Active" | "Draft",
                        })
                      }
                    >
                      <SelectTrigger className="mt-2 border-border/40 bg-card/40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Subscription Type
                  </Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.values(CourseSubscriptionType).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            subType: type,
                          })
                        }
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          formData.subType === type
                            ? "border-primary bg-primary/10"
                            : "border-border/40 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {getSubTypeIcon(type)}
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Preview */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/40 bg-muted/20 p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Course Preview
                </h4>

                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-lg">
                      {formData.courseTitle || "Course Title"}
                    </h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formData.courseDescription ||
                        "Course description will appear here"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn("rounded-full", getSubTypeColor(formData.subType))}
                    >
                      {formData.subType}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-border/40 bg-muted/30">
                      {formData.courseLanguage}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full",
                        formData.status === "Active"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "border-border/40 bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {formData.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/40">
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {formData.students}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">
                        {formData.lessons}
                      </p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold">{formData.slides}</p>
                      <p className="text-xs text-muted-foreground">Slides</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-muted/20 p-6">
                <h4 className="font-semibold mb-2">
                  Course Management
                </h4>
                <p className="text-sm text-muted-foreground">
                  After saving changes, you can manage lessons and slides
                  through the course editor tabs.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full border-border/40"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 rounded-full px-5 text-xs font-bold"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
