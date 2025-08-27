"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, BookOpen, AlertTriangle } from "lucide-react";
import { ISlide } from "@/types/slide";
import { ILesson } from "@/types/lesson";
import { Types } from "mongoose";

interface SlideContentTabProps {
  formData: ISlide;
  setFormData: (data: ISlide) => void;
  courseLessons: ILesson[];
}

// Helper function to extract lesson ID from various formats
const getLessonId = (lesson: any): string => {
  console.log("getLessonId - lesson:", lesson);
  if (!lesson) return "";
  if (typeof lesson === "string") return lesson;
  if (lesson instanceof Types.ObjectId) return lesson.toString();
  if (lesson && typeof lesson === "object") {
    // Handle lesson object with _id property
    if ("_id" in lesson) {
      const id = (lesson as any)._id;
      if (id) {
        return typeof id === "string" ? id : id.toString();
      }
    }
    // Handle lesson object with id property
    if ("id" in lesson) {
      const id = (lesson as any).id;
      if (id) {
        return typeof id === "string" ? id : id.toString();
      }
    }
  }
  console.log("Lesson ID not found:", lesson);
  return "";
};

// Helper function to find lesson by ID in courseLessons array
const findLessonById = (
  lessonId: string,
  lessons: ILesson[]
): ILesson | null => {
  if (!lessonId || !lessons.length) return null;

  // Try to find by _id first (most common case)
  const lessonById = lessons.find((lesson) => {
    const lessonIdFromLesson = (lesson as any)._id?.toString?.();
    return lessonIdFromLesson === lessonId;
  });

  if (lessonById) return lessonById;

  // Fallback: try to find by title (less common)
  const lessonByTitle = lessons.find((lesson) => lesson.title === lessonId);
  return lessonByTitle || null;
};

const fontOptions = [
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
];

export function SlideContentTab({
  formData,
  setFormData,
  courseLessons,
}: SlideContentTabProps) {
  const [showFallback, setShowFallback] = useState(false);
  // Debug logging to understand the data structure
  console.log("SlideContentTab - formData.lesson:", formData.lesson);
  console.log("SlideContentTab - courseLessons:", courseLessons);
  console.log(
    "SlideContentTab - getLessonId(formData.lesson):",
    getLessonId(formData.lesson)
  );

  const currentLessonId = getLessonId(formData.lesson);
  const currentLesson = findLessonById(currentLessonId, courseLessons);

  // Additional debugging for lesson matching
  console.log("Current lesson ID:", currentLessonId);
  console.log(
    "Available lesson IDs:",
    courseLessons.map((l) => l._id)
  );
  console.log("Found lesson:", currentLesson);

  // If we have a lesson but can't find it in the list, log it for debugging
  if (currentLessonId && !currentLesson) {
    console.warn("Lesson ID not found in courseLessons:", currentLessonId);
    console.warn(
      "Available lesson IDs:",
      courseLessons.map((l) => (l as any)._id?.toString?.())
    );
  }

  // Effect to log when courseLessons changes and handle fallback
  useEffect(() => {
    if (courseLessons.length > 0) {
      console.log("CourseLessons updated:", courseLessons);
      console.log("Current lesson ID:", currentLessonId);
      console.log("Found lesson:", currentLesson);

      // If we have a lesson ID but can't find the lesson, show fallback
      if (currentLessonId && !currentLesson) {
        setShowFallback(true);
      } else {
        setShowFallback(false);
      }
    }
  }, [courseLessons, currentLessonId, currentLesson]);

  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="title"
          className="text-sm font-medium flex items-center gap-2"
        >
          <Layers className="h-4 w-4" />
          Slide Title
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter slide title"
          className="mt-2"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="lessonId"
            className="text-sm font-medium flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Lesson
          </Label>
          <Select
            value={getLessonId(formData.lesson)}
            onValueChange={(value) => {
              console.log("Lesson selection changed to:", value);
              setFormData({
                ...formData,
                lesson: new Types.ObjectId(value),
              });
            }}
          >
            <SelectTrigger className="mt-2">
              <SelectValue
                placeholder={
                  currentLesson
                    ? currentLesson.title
                    : showFallback
                      ? `Lesson ${currentLessonId?.substring(0, 8)}... (not found)`
                      : "Select a lesson"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {courseLessons.map((lesson) => {
                const lessonId = (lesson as any)._id?.toString?.();
                return (
                  <SelectItem key={lessonId} value={lessonId}>
                    {lesson.title}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {showFallback && (
            <div className="mt-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <Badge
                variant="outline"
                className="text-amber-700 border-amber-300"
              >
                Associated lesson not found in course
              </Badge>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="order" className="text-sm font-medium">
            Order
          </Label>
          <Input
            id="order"
            type="number"
            min="1"
            value={formData.order}
            onChange={(e) =>
              setFormData({
                ...formData,
                order: Number.parseInt(e.target.value) || 1,
              })
            }
            placeholder="1"
            className="mt-2"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Title Font</Label>
          <Select
            value={formData.titleFont || "Inter"}
            onValueChange={(value) =>
              setFormData({ ...formData, titleFont: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
