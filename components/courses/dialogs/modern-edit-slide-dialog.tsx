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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers, Palette, Code, Type } from "lucide-react";
import { motion } from "framer-motion";
import { ILesson } from "@/types/lesson";
import { toast } from "@/hooks/use-toast";
import { ISlide } from "@/types/slide";
import { Types } from "mongoose";
import {
  createSlideWithImages,
  updateSlide,
  type CreateSlideData,
} from "@/lib/slide-api";
import ImagePickerDialog from "@/components/media/image-picker-dialog";
import { uploadImages } from "@/lib/api/image";
import {
  SlideContentTab,
  SlideInteractiveTab,
  SlideCodeTab,
  SlideThemeTab,
  SlidePreview,
} from "./slide";

interface ModernEditSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slide?: ISlide | null;
  courseId: string;
  lessons?: ILesson[];
  mode: "edit" | "create";
  onComplete?: (data: ISlide, imageFiles?: File[]) => void;
}

export function ModernEditSlideDialog({
  open,
  onOpenChange,
  slide,
  courseId,
  lessons = [],
  mode,
  onComplete,
}: ModernEditSlideDialogProps) {
  const [formData, setFormData] = useState<ISlide>({
    title: "",
    content: "",
    course: new Types.ObjectId(courseId),
    lesson: undefined,
    order: 1,
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
  });

  const [activeTab, setActiveTab] = useState("content");
  const [isLoading, setIsLoading] = useState(false);
  const [courseLessons, setCourseLessons] = useState<ILesson[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  useEffect(() => {
    if (slide) {
      console.log("Setting slide data in edit mode:", slide);
      console.log("Slide lesson:", slide.lesson);
      setFormData(slide);
      setUploadedImages(slide.imageUrls || []);
      setSelectedFiles([]);
    } else {
      setFormData({
        title: "",
        content: "",
        course: new Types.ObjectId(courseId),
        lesson: undefined,
        order: 1,
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
      });
      setUploadedImages([]);
      setSelectedFiles([]);
    }
  }, [slide, open, courseId]);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_API_URL) {
          console.error("API URL is not configured");
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/lessons?courseId=${courseId}`,
          {
            credentials: "include",
          }
        );

        if (response.ok) {
          const lessonsData = await response.json();
          console.log("Fetched lessons data:", lessonsData);
          setCourseLessons(lessonsData);
        } else {
          console.error("Failed to fetch lessons for course:", courseId);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
      }
    };

    if (open && courseId) {
      fetchLessons();
    }
  }, [open, courseId]);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Slide title is required");
    }

    if (
      !formData.content?.trim() &&
      !formData.startingCode?.trim() &&
      (formData.imageUrls?.length || 0) === 0
    ) {
      errors.push("Slide must have content, code, or images");
    }

    if (formData.order < 0) {
      errors.push("Slide order must be at least 0");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let finalImageUrls = formData.imageUrls || [];

      if (onComplete) {
        await onComplete(
          {
            ...formData,
            imageUrls: finalImageUrls,
          },
          selectedFiles
        );
        toast({
          title:
            mode === "edit"
              ? "Slide updated successfully!"
              : "Slide created successfully!",
          description: formData.title,
          variant: "default",
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title:
          mode === "edit" ? "Failed to update slide" : "Failed to create slide",
        description: (error as Error)?.message || "Unknown error",
        variant: "destructive",
      });
      console.error("Error creating/updating slide:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm shadow-sm">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {mode === "edit" ? "Edit Slide" : "Create New Slide"}
          </DialogTitle>
          <p className="text-muted-foreground">
            {mode === "edit"
              ? "Update your slide content and design"
              : "Design an engaging slide for your course"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div
            className={`grid gap-8 ${activeTab === "interactive" ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}
          >
            {/* Left Column - Form */}
            <div
              className={`space-y-6 transition-all duration-300 ${activeTab === "interactive" ? "lg:col-span-1" : ""}`}
            >
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-1"
                  >
                    <Type className="h-3 w-3" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="interactive"
                    className="flex items-center gap-1"
                  >
                    <Layers className="h-3 w-3" />
                    Markdown
                  </TabsTrigger>
                  <TabsTrigger value="code" className="flex items-center gap-1">
                    <Code className="h-3 w-3" />
                    Code
                  </TabsTrigger>
                  <TabsTrigger
                    value="theme"
                    className="flex items-center gap-1"
                  >
                    <Palette className="h-3 w-3" />
                    Theme
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <SlideContentTab
                    formData={formData}
                    setFormData={setFormData}
                    courseLessons={courseLessons}
                  />
                </TabsContent>

                <TabsContent value="interactive" className="space-y-4">
                  <SlideInteractiveTab
                    formData={formData}
                    setFormData={setFormData}
                    onOpenImagePicker={() => setIsImagePickerOpen(true)}
                  />
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <SlideCodeTab formData={formData} setFormData={setFormData} />
                </TabsContent>

                <TabsContent value="theme" className="space-y-4">
                  <SlideThemeTab
                    formData={formData}
                    setFormData={setFormData}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Preview */}
            {activeTab !== "interactive" && (
              <SlidePreview formData={formData} />
            )}
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
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  {mode === "edit" ? "Saving..." : "Creating..."}
                </>
              ) : (
                <>{mode === "edit" ? "Save Changes" : "Create Slide"}</>
              )}
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
              imageUrls: Array.from(
                new Set([...(fd.imageUrls || []), ...urls])
              ),
            }));
            return urls;
          }}
          onInsert={(url, meta) => {
            const widthAttr = meta?.width ? ` width=\"${meta.width}\"` : "";
            const heightAttr = meta?.height ? ` height=\"${meta.height}\"` : "";
            const altAttr = meta?.alt || "";
            const snippet = `\n<img src=\"${url}\" alt=\"${altAttr}\"${widthAttr}${heightAttr} />\n`;
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
      </DialogContent>
    </Dialog>
  );
}
