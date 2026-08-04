"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Types } from "mongoose";
import {
  CourseStatus,
  CourseSubscriptionType,
  type ICreateCourseDto,
  type IUpdateCourseDto,
} from "@/types/course";
import { ILesson, ICreateLessonDto } from "@/types/lesson";
import { ISlide, ICreateSlideDto } from "@/types/slide";
import {
  fetchCompleteCourseData,
  createCourse,
  updateCourse,
  createLesson,
  updateLesson,
  deleteLesson,
  createSlide,
  updateSlide,
  deleteSlide,
  reorderSlides,
  type ClientCourse,
} from "@/lib/api/course";
import { useAuth } from "@/hooks/use-auth";
import { getIdeLearnUrl } from "@/lib/utils";
import { CourseEditorPageSkeleton } from "../loading/course-edit-skeleton";
import { CourseNotFound } from "../course-not-found";
import {
  CourseWorkspaceTabs,
  type WorkspaceTab,
} from "./course-workspace-tabs";
import { CourseWorkspaceSidebar } from "./course-workspace-sidebar";
import { CourseDetailsPanel } from "./panels/course-details-panel";
import { LessonDetailsPanel } from "./panels/lesson-details-panel";
import { SlideEditorPanel } from "./panels/slide-editor-panel";

interface CourseWorkspaceProps {
  mode: "create" | "edit";
  courseId?: string;
}

type WorkspaceSession = {
  activeTab: WorkspaceTab;
  selectedLessonId: string | null;
  selectedSlideId: string | null;
  isCreatingLesson: boolean;
  isCreatingSlide: boolean;
};

function workspaceSessionKey(mode: string, courseId?: string) {
  return `beblocky-workspace-session:${mode}:${courseId || "new"}`;
}

function readWorkspaceSession(
  mode: string,
  courseId?: string
): WorkspaceSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(workspaceSessionKey(mode, courseId));
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceSession;
  } catch {
    return null;
  }
}

function writeWorkspaceSession(
  mode: string,
  courseId: string | undefined,
  session: WorkspaceSession
) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      workspaceSessionKey(mode, courseId),
      JSON.stringify(session)
    );
  } catch {
    /* ignore quota */
  }
}

export function CourseWorkspace({ mode, courseId }: CourseWorkspaceProps) {
  const router = useRouter();
  const { user } = useAuth();

  const restored = useMemo(
    () => readWorkspaceSession(mode, courseId),
    [mode, courseId]
  );

  const [course, setCourse] = useState<ClientCourse | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [slides, setSlides] = useState<ISlide[]>([]);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    restored?.activeTab || "course"
  );
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(
    restored?.selectedLessonId ?? null
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    restored?.selectedSlideId ?? null
  );
  const [isCreatingLesson, setIsCreatingLesson] = useState(
    restored?.isCreatingLesson ?? false
  );
  const [isCreatingSlide, setIsCreatingSlide] = useState(
    restored?.isCreatingSlide ?? false
  );
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [sessionHydrated, setSessionHydrated] = useState(mode !== "edit");

  const resolvedCourseId = course?._id || courseId || "";
  const contentLocked = mode === "create" && !course;

  useEffect(() => {
    if (mode !== "edit" || !courseId) return;

    const load = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCompleteCourseData(courseId);
        setCourse(data.course);
        setLessons(data.lessons);
        setSlides(data.slides);

        const saved = readWorkspaceSession(mode, courseId);
        const lessonIds = new Set(
          data.lessons.map((l) => l._id?.toString()).filter(Boolean)
        );
        const slideIds = new Set(
          data.slides.map((s) => s._id?.toString()).filter(Boolean)
        );

        if (saved?.activeTab) setActiveTab(saved.activeTab);
        if (saved?.selectedLessonId && lessonIds.has(saved.selectedLessonId)) {
          setSelectedLessonId(saved.selectedLessonId);
        } else if (data.lessons[0]?._id) {
          setSelectedLessonId(data.lessons[0]._id.toString());
        }
        if (saved?.selectedSlideId && slideIds.has(saved.selectedSlideId)) {
          setSelectedSlideId(saved.selectedSlideId);
        } else if (data.slides[0]?._id) {
          setSelectedSlideId(data.slides[0]._id.toString());
        }
        setIsCreatingLesson(Boolean(saved?.isCreatingLesson));
        setIsCreatingSlide(Boolean(saved?.isCreatingSlide));
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast.error("Failed to load course data");
      } finally {
        setIsLoading(false);
        setSessionHydrated(true);
      }
    };

    load();
  }, [mode, courseId]);

  // Persist editor session (tab + selection) across refresh
  useEffect(() => {
    if (!sessionHydrated) return;
    writeWorkspaceSession(mode, courseId || course?._id, {
      activeTab,
      selectedLessonId,
      selectedSlideId,
      isCreatingLesson,
      isCreatingSlide,
    });
  }, [
    sessionHydrated,
    mode,
    courseId,
    course?._id,
    activeTab,
    selectedLessonId,
    selectedSlideId,
    isCreatingLesson,
    isCreatingSlide,
  ]);

  const handleTabChange = (tab: WorkspaceTab) => {
    if (contentLocked && tab !== "course") {
      toast.error("Save the course first to manage lessons and slides");
      return;
    }
    setActiveTab(tab);
  };

  const handleSaveCourse = async (
    data: ICreateCourseDto | IUpdateCourseDto
  ) => {
    setIsSaving(true);
    try {
      if (mode === "create" && !course) {
        if (!user?._id) throw new Error("User not authenticated");
        const created = await createCourse(
          {
            courseTitle: data.courseTitle || "",
            courseDescription: data.courseDescription,
            courseLanguage: data.courseLanguage || "HTML",
            subType: data.subType || CourseSubscriptionType.FREE,
            status: data.status || CourseStatus.DRAFT,
            language: data.language,
            userId: user._id,
          },
          user._id
        );
        toast.success("Course created successfully!");
        router.replace(`/courses/${created._id}/edit`);
        return;
      }

      if (!resolvedCourseId) throw new Error("Missing course id");
      const updated = await updateCourse(resolvedCourseId, data, user?._id);
      setCourse((prev) => (prev ? { ...prev, ...updated } : updated));
      toast.success("Course updated successfully!");
    } catch (error) {
      console.error("Error saving course:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save course"
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLesson = async (data: ILesson) => {
    if (!resolvedCourseId) return;
    setIsSaving(true);
    try {
      if (isCreatingLesson || !selectedLessonId) {
        const payload: ICreateLessonDto = {
          title: data.title,
          description: data.description || "",
          courseId: new Types.ObjectId(resolvedCourseId),
          difficulty: data.difficulty,
          duration: data.duration,
          tags: data.tags || [],
        };
        const created = await createLesson(payload);
        setLessons((prev) => [...prev, created]);
        setCourse((prev) =>
          prev
            ? {
                ...prev,
                lessons: [...prev.lessons, new Types.ObjectId(created._id)],
                lessonsCount: (prev.lessonsCount || 0) + 1,
              }
            : prev
        );
        setIsCreatingLesson(false);
        setSelectedLessonId(created._id?.toString() || null);
        toast.success("Lesson created successfully!");
      } else {
        const updated = await updateLesson(selectedLessonId, {
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          duration: data.duration,
          tags: data.tags,
        });
        setLessons((prev) =>
          prev.map((l) => (l._id === updated._id ? updated : l))
        );
        toast.success("Lesson updated successfully!");
      }
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save lesson"
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await deleteLesson(lessonId);
      setLessons((prev) =>
        prev.filter((l) => l._id?.toString() !== lessonId)
      );
      setCourse((prev) =>
        prev
          ? { ...prev, lessonsCount: Math.max(0, (prev.lessonsCount || 0) - 1) }
          : prev
      );
      if (selectedLessonId === lessonId) {
        setSelectedLessonId(null);
        setIsCreatingLesson(false);
      }
      toast.success("Lesson deleted successfully!");
    } catch (error) {
      console.error("Error deleting lesson:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete lesson"
      );
    }
  };

  const toLessonIdString = (value: unknown): string | undefined => {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value && "toString" in value) {
      return (value as { toString: () => string }).toString();
    }
    return undefined;
  };

  const handleSaveSlide = async (data: ISlide, imageFiles?: File[]) => {
    if (!resolvedCourseId) return;
    setIsSaving(true);
    try {
      const lessonId = toLessonIdString(data.lesson);

      if (isCreatingSlide || !selectedSlideId) {
        if (!lessonId) {
          toast.error("Please assign this slide to a lesson");
          setIsSaving(false);
          return;
        }
        const payload: ICreateSlideDto = {
          title: data.title,
          content: data.content || "",
          order: data.order,
          courseId: new Types.ObjectId(resolvedCourseId),
          lessonId: new Types.ObjectId(lessonId),
          titleFont: data.titleFont || "Inter",
          startingCode: data.startingCode || "",
          solutionCode: data.solutionCode || "",
          imageUrls: data.imageUrls || [],
          backgroundColor: data.backgroundColor || "#ffffff",
          textColor: data.textColor || "#333333",
          themeColors: {
            main: data.themeColors?.main || "#892FFF",
            secondary: data.themeColors?.secondary || "#FF932C",
          },
        };
        const created = await createSlide(payload, imageFiles);
        setSlides((prev) => [...prev, created]);
        setCourse((prev) =>
          prev
            ? {
                ...prev,
                slides: [...prev.slides, new Types.ObjectId(created._id)],
                slidesCount: (prev.slidesCount || 0) + 1,
              }
            : prev
        );
        setIsCreatingSlide(false);
        setSelectedSlideId(created._id?.toString() || null);
        toast.success("Slide created successfully!");
      } else {
        const existing = slides.find(
          (s) => s._id?.toString() === selectedSlideId
        );
        const prevLessonId = toLessonIdString(existing?.lesson);
        const newLessonId = lessonId;
        const updated = await updateSlide(
          selectedSlideId,
          {
            title: data.title,
            content: data.content,
            order: data.order,
            lesson: newLessonId
              ? new Types.ObjectId(newLessonId)
              : undefined,
            titleFont: data.titleFont,
            startingCode: data.startingCode,
            solutionCode: data.solutionCode,
            backgroundColor: data.backgroundColor,
            textColor: data.textColor,
            themeColors: {
              main: data.themeColors?.main || "#892FFF",
              secondary: data.themeColors?.secondary || "#FF932C",
            },
            imageUrls: data.imageUrls,
          },
          imageFiles,
          prevLessonId !== newLessonId ? prevLessonId : undefined,
          prevLessonId !== newLessonId ? newLessonId : undefined
        );
        setSlides((prev) =>
          prev.map((s) => (s._id === updated._id ? updated : s))
        );
        toast.success("Slide updated successfully!");
      }
    } catch (error) {
      console.error("Error saving slide:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save slide"
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm("Delete this slide?")) return;
    try {
      await deleteSlide(slideId);
      setSlides((prev) => prev.filter((s) => s._id?.toString() !== slideId));
      setCourse((prev) =>
        prev
          ? { ...prev, slidesCount: Math.max(0, (prev.slidesCount || 0) - 1) }
          : prev
      );
      if (selectedSlideId === slideId) {
        setSelectedSlideId(null);
        setIsCreatingSlide(false);
      }
      toast.success("Slide deleted successfully!");
    } catch (error) {
      console.error("Error deleting slide:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete slide"
      );
    }
  };

  if (isLoading) {
    return <CourseEditorPageSkeleton />;
  }

  if (mode === "edit" && !course) {
    return <CourseNotFound courseId={courseId || ""} />;
  }

  const selectedLesson =
    lessons.find((l) => l._id?.toString() === selectedLessonId) || null;
  const selectedSlide =
    slides.find((s) => s._id?.toString() === selectedSlideId) || null;

  return (
    <div className="h-[calc(100dvh-3.5rem)] md:h-dvh min-h-[600px] flex flex-col bg-muted/10">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/courses" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </Button>

          <div className="hidden md:flex items-center gap-2 min-w-0 max-w-[200px]">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold truncate">
              {course?.courseTitle || "New Course"}
            </span>
            {course?.status && (
              <Badge
                variant={
                  course.status === CourseStatus.ACTIVE ? "default" : "secondary"
                }
                className="shrink-0"
              >
                {course.status}
              </Badge>
            )}
          </div>

          <div className="flex-1 px-2">
            <CourseWorkspaceTabs
              value={activeTab}
              onChange={handleTabChange}
              disabledTabs={
                contentLocked ? (["lessons", "slides"] as WorkspaceTab[]) : []
              }
            />
          </div>

          {course && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() =>
                window.open(getIdeLearnUrl(resolvedCourseId), "_blank")
              }
            >
              <Eye className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="border-b md:border-b-0 md:border-r border-border/60 bg-card overflow-hidden max-h-[240px] md:max-h-none">
          <CourseWorkspaceSidebar
            activeTab={activeTab}
            course={course}
            lessons={lessons}
            slides={slides}
            selectedLessonId={selectedLessonId}
            selectedSlideId={selectedSlideId}
            isCreatingLesson={isCreatingLesson}
            isCreatingSlide={isCreatingSlide}
            contentLocked={contentLocked}
            isSavingOrder={isSavingOrder}
            onSelectLesson={(id) => {
              setIsCreatingLesson(false);
              setSelectedLessonId(id);
            }}
            onSelectSlide={(id) => {
              setIsCreatingSlide(false);
              setSelectedSlideId(id);
            }}
            onAddLesson={() => {
              setIsCreatingLesson(true);
              setSelectedLessonId(null);
            }}
            onAddSlide={() => {
              setIsCreatingSlide(true);
              setSelectedSlideId(null);
            }}
            onDeleteLesson={handleDeleteLesson}
            onDeleteSlide={handleDeleteSlide}
            onSaveSlideOrder={async (lessonId, orderedSlideIds) => {
              setIsSavingOrder(true);
              try {
                const updatedLessonSlides = await reorderSlides(
                  lessonId,
                  orderedSlideIds
                );
                setSlides((prev) => {
                  const byId = new Map(
                    prev.map((s) => [s._id?.toString() || "", s])
                  );
                  const remaining = prev.filter((s) => {
                    const lid =
                      (s as ISlide & { lessonId?: { toString: () => string } })
                        .lessonId?.toString?.() ||
                      (typeof s.lesson === "string"
                        ? s.lesson
                        : s.lesson?.toString());
                    return lid !== lessonId;
                  });
                  const merged = updatedLessonSlides.map((s) => {
                    const id = s._id?.toString() || "";
                    const existing = byId.get(id);
                    return existing
                      ? {
                          ...existing,
                          order: s.order,
                          lesson:
                            (s as ISlide).lesson ??
                            (s as ISlide & { lessonId?: ISlide["lesson"] })
                              .lessonId ??
                            existing.lesson,
                        }
                      : s;
                  });
                  return [...remaining, ...merged];
                });
                toast.success("Slide order saved");
              } catch (error) {
                console.error(error);
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to save slide order"
                );
              } finally {
                setIsSavingOrder(false);
              }
            }}
          />
        </aside>

        <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
          {activeTab === "course" && (
            <CourseDetailsPanel
              mode={course ? "edit" : "create"}
              course={course}
              lessonsCount={lessons.length}
              slidesCount={slides.length}
              isSaving={isSaving}
              onSave={handleSaveCourse}
            />
          )}

          {activeTab === "lessons" && (
            <>
              {isCreatingLesson || selectedLesson ? (
                <LessonDetailsPanel
                  mode={isCreatingLesson ? "create" : "edit"}
                  lesson={isCreatingLesson ? null : selectedLesson}
                  courseId={resolvedCourseId}
                  isSaving={isSaving}
                  onSave={handleSaveLesson}
                  onCancelCreate={() => {
                    setIsCreatingLesson(false);
                    if (lessons[0]?._id) {
                      setSelectedLessonId(lessons[0]._id.toString());
                    }
                  }}
                />
              ) : (
                <EmptyCanvas
                  title="Select a lesson"
                  description="Choose a lesson from the sidebar, or create a new one."
                  actionLabel="Add Lesson"
                  onAction={() => {
                    setIsCreatingLesson(true);
                    setSelectedLessonId(null);
                  }}
                />
              )}
            </>
          )}

          {activeTab === "slides" && (
            <>
              {isCreatingSlide || selectedSlide ? (
                <SlideEditorPanel
                  mode={isCreatingSlide ? "create" : "edit"}
                  slide={isCreatingSlide ? null : selectedSlide}
                  courseId={resolvedCourseId}
                  lessons={lessons}
                  existingSlides={slides}
                  isSaving={isSaving}
                  onSave={handleSaveSlide}
                  onCancelCreate={() => {
                    setIsCreatingSlide(false);
                    if (slides[0]?._id) {
                      setSelectedSlideId(slides[0]._id.toString());
                    }
                  }}
                />
              ) : (
                <EmptyCanvas
                  title="Select a slide"
                  description="Choose a slide from the sidebar, or create a new one."
                  actionLabel="Add Slide"
                  onAction={() => {
                    setIsCreatingSlide(true);
                    setSelectedSlideId(null);
                  }}
                  disabled={lessons.length === 0}
                  disabledHint="Create a lesson before adding slides."
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyCanvas({
  title,
  description,
  actionLabel,
  onAction,
  disabled,
  disabledHint,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="text-center max-w-sm space-y-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {disabled && disabledHint ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {disabledHint}
          </p>
        ) : (
          <Button onClick={onAction} disabled={disabled}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
