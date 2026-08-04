"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
import {
  BookOpen,
  Globe,
  Crown,
  Star,
  Users,
  Save,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  CourseSubscriptionType,
  type ICreateCourseDto,
  type IUpdateCourseDto,
} from "@/types/course";
import {
  convertFromModernCourse,
  convertToModernCourse,
  type ClientCourse,
  type ModernCourse,
} from "@/lib/api/course";

interface CourseDetailsPanelProps {
  mode: "create" | "edit";
  course: ClientCourse | null;
  lessonsCount?: number;
  slidesCount?: number;
  isSaving?: boolean;
  onSave: (data: ICreateCourseDto | IUpdateCourseDto) => Promise<void>;
}

const emptyForm = (): ModernCourse => ({
  id: "",
  courseTitle: "",
  courseDescription: "",
  courseLanguage: "HTML",
  subType: CourseSubscriptionType.FREE,
  category: "English",
  status: "Draft",
  students: 0,
  lessons: 0,
  slides: 0,
  rating: 0,
  lastUpdated: "Just now",
});

export function CourseDetailsPanel({
  mode,
  course,
  lessonsCount = 0,
  slidesCount = 0,
  isSaving = false,
  onSave,
}: CourseDetailsPanelProps) {
  const [formData, setFormData] = useState<ModernCourse>(emptyForm());
  const [error, setError] = useState("");

  useEffect(() => {
    if (course) {
      const modern = convertToModernCourse(course);
      setFormData({
        ...modern,
        lessons: lessonsCount || modern.lessons,
        slides: slidesCount || modern.slides,
      });
    } else {
      setFormData(emptyForm());
    }
    setError("");
  }, [course, lessonsCount, slidesCount]);

  const getSubTypeIcon = (subType: CourseSubscriptionType) => {
    switch (subType) {
      case CourseSubscriptionType.PRO:
        return <Crown className="h-4 w-4" />;
      case CourseSubscriptionType.BUILDER:
        return <Star className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getSubTypeColor = (subType: CourseSubscriptionType) => {
    switch (subType) {
      case CourseSubscriptionType.PRO:
        return "from-[#892FFF] to-[#6B1FD9]";
      case CourseSubscriptionType.STARTER:
        return "from-[#FF932C] to-[#E67A14]";
      case CourseSubscriptionType.BUILDER:
        return "from-[#892FFF] to-[#FF932C]";
      case CourseSubscriptionType.ORGANIZATION:
        return "from-[#FF932C] to-[#892FFF]";
      default:
        return "from-muted-foreground to-muted-foreground";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.courseTitle.trim()) {
      setError("Course title is required");
      return;
    }

    try {
      const payload = convertFromModernCourse(formData);
      await onSave(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div>
          <h2 className="text-xl font-bold">
            {mode === "create" ? "Create Course" : "Course Details"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Set up your course, then add lessons and slides"
              : "Update your course information and settings"}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="courseDescription" className="text-sm font-medium">
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
                rows={8}
                className="mt-2 min-h-[10rem]"
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
                  <SelectTrigger className="mt-2">
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
                  <SelectTrigger className="mt-2">
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
              <Label className="text-sm font-medium">Subscription Type</Label>
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
                        : "border-border hover:border-primary/50"
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

          <div className="p-6 bg-muted/40 rounded-2xl border border-border/60 space-y-4 h-fit">
            <h4 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Preview
            </h4>
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
                className={`bg-gradient-to-r ${getSubTypeColor(formData.subType)} text-white border-0`}
              >
                {formData.subType}
              </Badge>
              <Badge variant="outline">{formData.courseLanguage}</Badge>
              <Badge
                variant={
                  formData.status === "Active" ? "default" : "secondary"
                }
              >
                {formData.status}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/60">
              <div className="text-center">
                <p className="text-lg font-semibold">{formData.students}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{formData.lessons}</p>
                <p className="text-xs text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{formData.slides}</p>
                <p className="text-xs text-muted-foreground">Slides</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4 flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
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
          {isSaving
            ? "Saving..."
            : mode === "create"
              ? "Create Course"
              : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
