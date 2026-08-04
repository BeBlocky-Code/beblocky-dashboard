"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  MoreVertical,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { ILesson, LessonDifficulty } from "@/types/lesson";
import { cn } from "@/lib/utils";

interface ModernManageLessonsProps {
  courseId: string;
  lessons: ILesson[];
  onCreateLesson?: () => void;
  onEditLesson?: (lesson: ILesson) => void;
  onDeleteLesson?: (lesson: ILesson) => void;
}

export function ModernManageLessons({
  courseId,
  lessons,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
}: ModernManageLessonsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | LessonDifficulty>("all");

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      (lesson.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lesson.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === "all" || lesson.difficulty === activeTab;

    return matchesSearch && matchesTab;
  });

  const handleEdit = (lesson: ILesson) => {
    if (onEditLesson) {
      onEditLesson(lesson);
    }
  };

  const handleDelete = (lesson: ILesson) => {
    if (onDeleteLesson) {
      onDeleteLesson(lesson);
    }
  };

  const handleCreateNew = () => {
    if (onCreateLesson) {
      onCreateLesson();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case LessonDifficulty.BEGINNER:
        return "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
      case LessonDifficulty.INTERMEDIATE:
        return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
      case LessonDifficulty.ADVANCED:
        return "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300";
      default:
        return "border-border/40 bg-muted/30 text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">
              Course Lessons
            </h3>
            <p className="text-muted-foreground">
              Manage and organize your course content into engaging lessons
            </p>
          </div>

          <Button
            onClick={handleCreateNew}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Lesson
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search lessons..."
              className="pl-10 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {[
              "all",
              LessonDifficulty.BEGINNER,
              LessonDifficulty.INTERMEDIATE,
              LessonDifficulty.ADVANCED,
            ].map((tabOption) => (
              <Button
                key={tabOption}
                variant={activeTab === tabOption ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tabOption as typeof activeTab)}
                className={cn(
                  "capitalize rounded-full",
                  activeTab !== tabOption && "border-border/40"
                )}
              >
                {tabOption === "all" ? "All" : tabOption}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <LessonStatCard
            title="Total Lessons"
            value={lessons.length.toString()}
            icon={BookOpen}
            iconClass="text-primary bg-primary/10"
          />
          <LessonStatCard
            title="Total Duration"
            value={`${lessons.reduce((sum, lesson) => sum + lesson.duration, 0)}m`}
            icon={Clock}
            iconClass="text-secondary bg-secondary/10"
          />
          <LessonStatCard
            title="Beginner"
            value={lessons
              .filter((l) => l.difficulty === LessonDifficulty.BEGINNER)
              .length.toString()}
            icon={GraduationCap}
            iconClass="text-emerald-600 bg-emerald-500/10"
          />
          <LessonStatCard
            title="Intermediate"
            value={lessons
              .filter((l) => l.difficulty === LessonDifficulty.INTERMEDIATE)
              .length.toString()}
            icon={GraduationCap}
            iconClass="text-amber-600 bg-amber-500/10"
          />
          <LessonStatCard
            title="Advanced"
            value={lessons
              .filter((l) => l.difficulty === LessonDifficulty.ADVANCED)
              .length.toString()}
            icon={GraduationCap}
            iconClass="text-rose-600 bg-rose-500/10"
          />
        </div>
      </div>

      {/* Lessons Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        layout
      >
        <AnimatePresence>
          {filteredLessons.map((lesson, index) => (
            <motion.div
              key={
                (lesson as any)._id?.toString?.() || `${lesson.title}-${index}`
              }
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              layout
            >
              <ModernLessonCard
                lesson={lesson}
                onEdit={() => handleEdit(lesson)}
                onDelete={() => handleDelete(lesson)}
                getDifficultyColor={getDifficultyColor}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredLessons.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-muted-foreground mb-2">
            No lessons found
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first lesson to get started"}
          </p>
          <Button
            onClick={handleCreateNew}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create First Lesson
          </Button>
        </motion.div>
      )}
    </div>
  );
}

interface ModernLessonCardProps {
  lesson: ILesson;
  onEdit: () => void;
  onDelete: () => void;
  getDifficultyColor: (difficulty: string) => string;
}

function ModernLessonCard({
  lesson,
  onEdit,
  onDelete,
  getDifficultyColor,
}: ModernLessonCardProps) {
  return (
    <Card className="group rounded-2xl border border-border/40 bg-card/40 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/70 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex-1 space-y-2">
          <h4 className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {lesson.title}
          </h4>
          <p className="text-muted-foreground text-sm line-clamp-2">
            {lesson.description}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge
              variant="outline"
              className={cn("rounded-full", getDifficultyColor(lesson.difficulty))}
            >
              {lesson.difficulty}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/40 bg-muted/30">
              {lesson.duration} min
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/40 bg-muted/30">
              {lesson.slides.length} slides
            </Badge>
            {lesson.tags &&
              lesson.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full border-border/40 bg-muted/30">
                  {tag}
                </Badge>
              ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-4">
        <span className="text-xs text-muted-foreground">
          Updated{" "}
          {lesson.updatedAt
            ? new Date(lesson.updatedAt).toLocaleDateString()
            : "-"}
        </span>
      </div>
    </Card>
  );
}

interface LessonStatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}

function LessonStatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: LessonStatCardProps) {
  return (
    <Card className="rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/60">
      <div className="p-5">
        <div
          className={cn(
            "mb-4 flex h-11 w-11 items-center justify-center rounded-2xl",
            iconClass
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </Card>
  );
}
