"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClientCourse } from "@/lib/api/course";
import type { ILesson } from "@/types/lesson";
import type { ISlide } from "@/types/slide";
import {
  BookOpen,
  GripVertical,
  Layers,
  Plus,
  PlayCircle,
  Clock,
  Trash2,
  Save,
} from "lucide-react";
import type { WorkspaceTab } from "./course-workspace-tabs";

interface CourseWorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  course: ClientCourse | null;
  lessons: ILesson[];
  slides: ISlide[];
  selectedLessonId: string | null;
  selectedSlideId: string | null;
  isCreatingLesson: boolean;
  isCreatingSlide: boolean;
  contentLocked: boolean;
  isSavingOrder?: boolean;
  onSelectLesson: (id: string) => void;
  onSelectSlide: (id: string) => void;
  onAddLesson: () => void;
  onAddSlide: () => void;
  onDeleteLesson: (id: string) => void;
  onDeleteSlide: (id: string) => void;
  onSaveSlideOrder?: (lessonId: string, orderedSlideIds: string[]) => Promise<void>;
}

function lessonIdOf(slide: ISlide): string | undefined {
  const raw =
    (slide as ISlide & { lessonId?: unknown }).lessonId ?? slide.lesson;
  if (!raw) return undefined;
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && raw !== null && "_id" in raw) {
    const id = (raw as { _id: { toString?: () => string } | string })._id;
    return typeof id === "string" ? id : id?.toString?.();
  }
  if (typeof (raw as { toString?: () => string }).toString === "function") {
    return (raw as { toString: () => string }).toString();
  }
  return undefined;
}

function sortByOrder(a: ISlide, b: ISlide) {
  return (a.order ?? 0) - (b.order ?? 0);
}

/** Insertion marker rendered in the gap the dragged slide will land in. */
function SlideDropLine({ position }: { position: "top" | "bottom" }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.7 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.7 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      style={{ originX: 0 }}
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 flex items-center gap-1",
        position === "top" ? "-top-1" : "-bottom-1"
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
      <span className="h-0.5 flex-1 rounded-full bg-primary" />
    </motion.div>
  );
}

export function CourseWorkspaceSidebar({
  activeTab,
  course,
  lessons,
  slides,
  selectedLessonId,
  selectedSlideId,
  isCreatingLesson,
  isCreatingSlide,
  contentLocked,
  isSavingOrder = false,
  onSelectLesson,
  onSelectSlide,
  onAddLesson,
  onAddSlide,
  onDeleteLesson,
  onDeleteSlide,
  onSaveSlideOrder,
}: CourseWorkspaceSidebarProps) {
  // Draft order per lesson: lessonId -> slideId[]
  const [draftOrders, setDraftOrders] = useState<Record<string, string[]>>({});
  const [dragState, setDragState] = useState<{
    lessonId: string;
    slideId: string;
  } | null>(null);
  // Gap index the slide will be inserted at (0…list.length)
  const [dropTarget, setDropTarget] = useState<{
    lessonId: string;
    index: number;
  } | null>(null);

  const slidesSignature = useMemo(
    () =>
      slides
        .map((s) => `${s._id}:${s.order}:${lessonIdOf(s)}`)
        .sort()
        .join("|"),
    [slides]
  );

  useEffect(() => {
    const next: Record<string, string[]> = {};
    for (const lesson of lessons) {
      const lid = lesson._id?.toString();
      if (!lid) continue;
      next[lid] = slides
        .filter((s) => lessonIdOf(s) === lid)
        .sort(sortByOrder)
        .map((s) => s._id?.toString() || "")
        .filter(Boolean);
    }
    // Unassigned slides bucket
    const unassigned = slides
      .filter((s) => !lessonIdOf(s))
      .sort(sortByOrder)
      .map((s) => s._id?.toString() || "")
      .filter(Boolean);
    if (unassigned.length) next["__unassigned__"] = unassigned;
    setDraftOrders(next);
  }, [slidesSignature, lessons, slides]);

  const dirtyLessonIds = useMemo(() => {
    const dirty: string[] = [];
    for (const [lessonId, ids] of Object.entries(draftOrders)) {
      if (lessonId === "__unassigned__") continue;
      const current = slides
        .filter((s) => lessonIdOf(s) === lessonId)
        .sort(sortByOrder)
        .map((s) => s._id?.toString() || "");
      if (
        ids.length === current.length &&
        ids.some((id, i) => id !== current[i])
      ) {
        dirty.push(lessonId);
      }
    }
    return dirty;
  }, [draftOrders, slides]);

  const slideById = useMemo(() => {
    const map = new Map<string, ISlide>();
    for (const s of slides) {
      const id = s._id?.toString();
      if (id) map.set(id, s);
    }
    return map;
  }, [slides]);

  const lessonGroups = useMemo(() => {
    const groups: { key: string; title: string; ids: string[] }[] = [];
    for (const lesson of lessons) {
      const lid = lesson._id?.toString();
      if (!lid) continue;
      const ids = draftOrders[lid] || [];
      if (ids.length > 0) {
        groups.push({
          key: lid,
          title: lesson.title || "Untitled lesson",
          ids,
        });
      }
    }
    const unassigned = draftOrders["__unassigned__"] || [];
    if (unassigned.length) {
      groups.push({
        key: "__unassigned__",
        title: "Unassigned",
        ids: unassigned,
      });
    }
    // Lessons with no slides yet — omit from stack
    return groups;
  }, [lessons, draftOrders]);

  /**
   * `insertIndex` is a gap position in the pre-move list (0…length), so the
   * slot after the last item stays reachable when dragging downward.
   */
  const moveSlideToIndex = (
    lessonId: string,
    slideId: string,
    insertIndex: number
  ) => {
    setDraftOrders((prev) => {
      const list = [...(prev[lessonId] || [])];
      const fromIndex = list.indexOf(slideId);
      if (fromIndex < 0) return prev;
      const clamped = Math.max(0, Math.min(insertIndex, list.length));
      const target = clamped > fromIndex ? clamped - 1 : clamped;
      if (target === fromIndex) return prev;
      list.splice(fromIndex, 1);
      list.splice(target, 0, slideId);
      return { ...prev, [lessonId]: list };
    });
  };

  const clearDrag = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const markDropTarget = (lessonId: string, index: number) => {
    setDropTarget((prev) =>
      prev && prev.lessonId === lessonId && prev.index === index
        ? prev
        : { lessonId, index }
    );
  };

  const commitDrop = (lessonId: string) => {
    if (dragState?.lessonId === lessonId && dropTarget?.lessonId === lessonId) {
      moveSlideToIndex(lessonId, dragState.slideId, dropTarget.index);
    }
    clearDrag();
  };

  if (activeTab === "course") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Course</h2>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Title</p>
              <p className="text-sm font-medium">
                {course?.courseTitle || "Untitled course"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={
                  course?.status === "Active" ? "default" : "secondary"
                }
                className="mt-1"
              >
                {course?.status || "Draft"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-semibold">{lessons.length}</p>
                <p className="text-[10px] text-muted-foreground">Lessons</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">{slides.length}</p>
                <p className="text-[10px] text-muted-foreground">Slides</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold">
                  {course?.studentsCount ?? course?.students?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground">Students</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeTab === "lessons") {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Lessons</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            disabled={contentLocked}
            onClick={onAddLesson}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isCreatingLesson && (
            <div className="rounded-xl border-2 border-primary bg-primary/10 p-3">
              <p className="text-sm font-medium">New lesson</p>
              <p className="text-xs text-muted-foreground">
                Fill in details on the right
              </p>
            </div>
          )}
          {lessons.length === 0 && !isCreatingLesson ? (
            <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No lessons yet</p>
              <Button size="sm" disabled={contentLocked} onClick={onAddLesson}>
                <Plus className="h-4 w-4 mr-1" />
                Add Lesson
              </Button>
            </div>
          ) : (
            lessons.map((lesson) => {
              const id = lesson._id?.toString() || "";
              const selected = selectedLessonId === id && !isCreatingLesson;
              const lessonSlides = slides.filter((s) => lessonIdOf(s) === id);
              return (
                <div
                  key={id}
                  className={cn(
                    "group rounded-xl border p-3 cursor-pointer transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border/60 bg-card hover:border-primary/40"
                  )}
                  onClick={() => onSelectLesson(id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lesson.title || "Untitled lesson"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {lessonSlides.length}
                        </span>
                        {lesson.duration != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.duration}m
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLesson(id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
          Click a lesson to edit, or add a new one.
        </p>
      </div>
    );
  }

  // Slides tab — stacked by lesson order, drag to rearrange, save to persist
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Slides</h2>
        </div>
        <div className="flex items-center gap-1">
          {dirtyLessonIds.length > 0 && onSaveSlideOrder && (
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2 text-xs"
              disabled={isSavingOrder || contentLocked}
              onClick={async () => {
                for (const lessonId of dirtyLessonIds) {
                  const ids = draftOrders[lessonId];
                  if (ids?.length) {
                    await onSaveSlideOrder(lessonId, ids);
                  }
                }
              }}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save order
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            disabled={contentLocked}
            onClick={onAddSlide}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {isCreatingSlide && (
          <div className="rounded-xl border-2 border-primary bg-primary/10 p-3">
            <p className="text-sm font-medium">New slide</p>
            <p className="text-xs text-muted-foreground">
              Fill in details on the right
            </p>
          </div>
        )}
        {slides.length === 0 && !isCreatingSlide ? (
          <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No slides yet</p>
            <Button size="sm" disabled={contentLocked} onClick={onAddSlide}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slide
            </Button>
          </div>
        ) : (
          lessonGroups.map((group) => {
            const isDraggingGroup = dragState?.lessonId === group.key;
            return (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </p>
                {dirtyLessonIds.includes(group.key) && (
                  <Badge variant="secondary" className="text-[10px]">
                    Unsaved
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {group.ids.map((id, index) => {
                  const slide = slideById.get(id);
                  if (!slide) return null;
                  const selected = selectedSlideId === id && !isCreatingSlide;
                  const canDrag =
                    group.key !== "__unassigned__" && !contentLocked;
                  const isDragging = dragState?.slideId === id;
                  const showLineAbove =
                    isDraggingGroup &&
                    dropTarget?.lessonId === group.key &&
                    dropTarget.index === index;
                  const showLineBelow =
                    isDraggingGroup &&
                    dropTarget?.lessonId === group.key &&
                    dropTarget.index === group.ids.length &&
                    index === group.ids.length - 1;
                  return (
                    <div
                      key={id}
                      draggable={canDrag}
                      onDragStart={(e) => {
                        if (!canDrag) return;
                        setDragState({ lessonId: group.key, slideId: id });
                        setDropTarget({ lessonId: group.key, index });
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", id);
                      }}
                      onDragOver={(e) => {
                        if (!canDrag || dragState?.lessonId !== group.key)
                          return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        const rect = e.currentTarget.getBoundingClientRect();
                        const isAfter =
                          e.clientY > rect.top + rect.height / 2;
                        markDropTarget(group.key, index + (isAfter ? 1 : 0));
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        commitDrop(group.key);
                      }}
                      onDragEnd={clearDrag}
                      onClick={() => onSelectSlide(id)}
                      className="relative"
                    >
                      <AnimatePresence>
                        {showLineAbove && <SlideDropLine position="top" />}
                        {showLineBelow && <SlideDropLine position="bottom" />}
                      </AnimatePresence>
                      <motion.div
                        layout
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className={cn(
                          "group rounded-xl border p-3 cursor-pointer transition-colors",
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-card hover:border-primary/40",
                          isDragging && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {canDrag && (
                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70 cursor-grab active:cursor-grabbing" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {slide.title || "Untitled slide"}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>#{index + 1}</span>
                              {slide.order !== index + 1 &&
                                dirtyLessonIds.includes(group.key) && (
                                  <span className="text-amber-600 dark:text-amber-400">
                                    was #{slide.order}
                                  </span>
                                )}
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSlide(id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {isDraggingGroup && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 36 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      markDropTarget(group.key, group.ids.length);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      commitDrop(group.key);
                    }}
                    className={cn(
                      "flex items-center justify-center rounded-xl border border-dashed text-[10px] font-medium uppercase tracking-wide transition-colors",
                      dropTarget?.lessonId === group.key &&
                        dropTarget.index === group.ids.length
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground"
                    )}
                  >
                    Drop here to place last
                  </motion.div>
                )}
              </div>
            </div>
            );
          })
        )}
      </div>
      <p className="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
        Drag a slide to the line where it should go, then Save order.
      </p>
    </div>
  );
}
