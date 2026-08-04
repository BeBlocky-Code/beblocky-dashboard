"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Palette, Code, Type, Save } from "lucide-react";
import { motion } from "framer-motion";
import { ILesson } from "@/types/lesson";
import { toast } from "sonner";
import { ISlide } from "@/types/slide";
import { Types } from "mongoose";
import ImagePickerDialog from "@/components/media/image-picker-dialog";
import { uploadImages } from "@/lib/api/image";
import {
  SlideContentTab,
  SlideInteractiveTab,
  SlideCodeTab,
  SlideThemeTab,
  SlidePreview,
} from "@/components/courses/dialogs/slide";
import { cn } from "@/lib/utils";

interface SlideEditorPanelProps {
  mode: "create" | "edit";
  slide: ISlide | null;
  courseId: string;
  lessons: ILesson[];
  existingSlides?: ISlide[];
  isSaving?: boolean;
  onSave: (data: ISlide, imageFiles?: File[]) => Promise<void>;
  onCancelCreate?: () => void;
}

function nextOrderForLesson(
  slides: ISlide[] | undefined,
  lessonId?: string
): number {
  if (!slides?.length) return 1;
  const orders = slides
    .filter((s) => {
      if (!lessonId) return true;
      const lid =
        (s as ISlide & { lessonId?: { toString: () => string } | string })
          .lessonId?.toString?.() ||
        (typeof s.lesson === "string" ? s.lesson : s.lesson?.toString());
      return lid === lessonId;
    })
    .map((s) => s.order ?? 0);
  return orders.length ? Math.max(...orders) + 1 : 1;
}

function emptySlide(courseId: string, order = 1): ISlide {
  return {
    title: "",
    content: "",
    course: new Types.ObjectId(courseId),
    lesson: undefined,
    order,
    titleFont: "Inter",
    startingCode: "",
    solutionCode: "",
    imageUrls: [],
    backgroundColor: "#ffffff",
    textColor: "#333333",
    themeColors: {
      main: "#892FFF",
      secondary: "#FF932C",
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function SlideEditorPanel({
  mode,
  slide,
  courseId,
  lessons,
  existingSlides = [],
  isSaving = false,
  onSave,
  onCancelCreate,
}: SlideEditorPanelProps) {
  const [formData, setFormData] = useState<ISlide>(
    emptySlide(courseId, nextOrderForLesson(existingSlides))
  );
  const [activeTab, setActiveTab] = useState("content");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const isMarkdownTab = activeTab === "interactive";

  useEffect(() => {
    if (slide) {
      setFormData(slide);
      setSelectedFiles([]);
    } else {
      setFormData(emptySlide(courseId, nextOrderForLesson(existingSlides)));
      setSelectedFiles([]);
    }
    setActiveTab("content");
    // existingSlides intentionally omitted — lesson change updates order via content tab
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide, courseId, mode]);

  const validateForm = () => {
    const errors: string[] = [];
    if (!formData.title.trim()) errors.push("Slide title is required");
    if (
      !formData.content?.trim() &&
      !formData.startingCode?.trim() &&
      (formData.imageUrls?.length || 0) === 0
    ) {
      errors.push("Slide must have content, code, or images");
    }
    if ((formData.order ?? 0) < 0) {
      errors.push("Slide order must be at least 0");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }
    await onSave(formData, selectedFiles);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-4 p-4 md:p-6",
            isMarkdownTab ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {mode === "edit" ? "Edit Slide" : "Create New Slide"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "edit"
                  ? "Update your slide content and design"
                  : "Design an engaging slide for your course"}
              </p>
            </div>
            {mode === "create" && onCancelCreate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={onCancelCreate}
              >
                Cancel
              </Button>
            )}
          </div>

          <div
            className={cn(
              "min-h-0",
              isMarkdownTab
                ? "flex flex-1 flex-col"
                : "grid grid-cols-1 gap-8 lg:grid-cols-2"
            )}
          >
            <div
              className={cn(
                "min-h-0",
                isMarkdownTab ? "flex flex-1 flex-col" : "space-y-6"
              )}
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className={cn(
                  "w-full",
                  isMarkdownTab && "flex min-h-0 flex-1 flex-col"
                )}
              >
                <TabsList className="grid h-auto w-full shrink-0 grid-cols-4 rounded-full border border-border/40 bg-muted/50 p-1.5">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    <Type className="h-3 w-3" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="interactive"
                    className="flex items-center gap-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    <Layers className="h-3 w-3" />
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="flex items-center gap-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    <Code className="h-3 w-3" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="theme"
                    className="flex items-center gap-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    <Palette className="h-3 w-3" />
                    Theme
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="mt-4 space-y-4">
                  <SlideContentTab
                    formData={formData}
                    setFormData={setFormData}
                    courseLessons={lessons}
                    existingSlides={existingSlides}
                    suggestOrderOnLessonChange={mode === "create"}
                  />
                </TabsContent>

                <TabsContent
                  value="interactive"
                  className="mt-4 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
                >
                  <SlideInteractiveTab
                    formData={formData}
                    setFormData={setFormData}
                    onOpenImagePicker={() => setIsImagePickerOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="code" className="mt-4 space-y-4">
                  <SlideCodeTab formData={formData} setFormData={setFormData} />
                </TabsContent>

                <TabsContent value="theme" className="mt-4 space-y-4">
                  <SlideThemeTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {!isMarkdownTab && <SlidePreview formData={formData} />}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border/60 px-6 py-4">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 rounded-full px-5 text-xs font-bold"
          >
            {isSaving ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
                className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
                ? "Save Changes"
                : "Create Slide"}
          </Button>
        </div>
      </form>

      <ImagePickerDialog
        open={isImagePickerOpen}
        onOpenChange={setIsImagePickerOpen}
        existingUrls={(formData.imageUrls || []).filter(
          (u) => !u.startsWith("blob:")
        )}
        onUploadFiles={async (files) => {
          const urls = await uploadImages(files);
          setFormData((fd) => ({
            ...fd,
            imageUrls: Array.from(new Set([...(fd.imageUrls || []), ...urls])),
          }));
          return urls;
        }}
        onInsert={(url, meta) => {
          const widthAttr = meta?.width ? ` width="${meta.width}"` : "";
          const heightAttr = meta?.height ? ` height="${meta.height}"` : "";
          const altAttr = meta?.alt || "";
          const snippet = `\n<img src="${url}" alt="${altAttr}"${widthAttr}${heightAttr} />\n`;
          document.dispatchEvent(
            new CustomEvent("markdown-editor-insert", { detail: { snippet } })
          );
          setFormData((fd) => ({
            ...fd,
            imageUrls: Array.from(new Set([...(fd.imageUrls || []), url])),
          }));
          setActiveTab("interactive");
          setIsImagePickerOpen(false);
        }}
      />
    </>
  );
}
