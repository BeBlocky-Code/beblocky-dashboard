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
import { BookOpen, Clock, GraduationCap, Save, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ILesson, LessonDifficulty } from "@/types/lesson";
import { Types } from "mongoose";

interface LessonDetailsPanelProps {
  mode: "create" | "edit";
  lesson: ILesson | null;
  courseId: string;
  isSaving?: boolean;
  onSave: (data: ILesson) => Promise<void>;
  onCancelCreate?: () => void;
}

function emptyLesson(courseId: string): ILesson {
  return {
    title: "",
    description: "",
    courseId: new Types.ObjectId(courseId),
    slides: [],
    difficulty: LessonDifficulty.BEGINNER,
    duration: 30,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function LessonDetailsPanel({
  mode,
  lesson,
  courseId,
  isSaving = false,
  onSave,
  onCancelCreate,
}: LessonDetailsPanelProps) {
  const [formData, setFormData] = useState<ILesson>(emptyLesson(courseId));
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (lesson) {
      setFormData(lesson);
    } else {
      setFormData(emptyLesson(courseId));
    }
  }, [lesson, courseId, mode]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push("Lesson title is required");
    if (!formData.description?.trim())
      errors.push("Lesson description is required");
    if (formData.duration < 1)
      errors.push("Lesson duration must be at least 1 minute");
    if (formData.duration > 300)
      errors.push("Lesson duration cannot exceed 300 minutes");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }
    await onSave(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove) || [],
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case LessonDifficulty.BEGINNER:
        return "from-green-500 to-green-600";
      case LessonDifficulty.INTERMEDIATE:
        return "from-yellow-500 to-yellow-600";
      case LessonDifficulty.ADVANCED:
        return "from-red-500 to-red-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "edit" ? "Edit Lesson" : "Create New Lesson"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "edit"
                ? "Update your lesson details"
                : "Design an engaging learning experience"}
            </p>
          </div>
          {mode === "create" && onCancelCreate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelCreate}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="lessonTitle"
                className="text-sm font-medium flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Lesson Title
              </Label>
              <Input
                id="lessonTitle"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter an engaging lesson title"
                className="mt-2"
                required
              />
            </div>

            <div>
              <Label htmlFor="lessonDescription" className="text-sm font-medium">
                Description
              </Label>
              <Textarea
                id="lessonDescription"
                value={formData.description}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    description: e.target.value,
                  })
                }
                placeholder="Describe what students will learn"
                rows={8}
                className="mt-2 min-h-[10rem]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="duration"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Clock className="h-4 w-4" />
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number.parseInt(e.target.value) || 30,
                    })
                  }
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label
                  htmlFor="difficulty"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  Difficulty
                </Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      difficulty: value as typeof formData.difficulty,
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={LessonDifficulty.BEGINNER}>
                      Beginner
                    </SelectItem>
                    <SelectItem value={LessonDifficulty.INTERMEDIATE}>
                      Intermediate
                    </SelectItem>
                    <SelectItem value={LessonDifficulty.ADVANCED}>
                      Advanced
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Tags</Label>
              <div className="mt-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline" size="sm">
                    Add
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-muted/40 rounded-2xl border border-border/60 space-y-4 h-fit">
            <h4 className="font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Lesson Preview
            </h4>
            <div>
              <h5 className="font-medium text-lg">
                {formData.title || "Lesson Title"}
              </h5>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.description || "Lesson description will appear here"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formData.duration}m</span>
              </div>
              <Badge
                className={`bg-gradient-to-r ${getDifficultyColor(formData.difficulty)} text-white border-0`}
              >
                {formData.difficulty}
              </Badge>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
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
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Lesson"}
        </Button>
      </div>
    </form>
  );
}
