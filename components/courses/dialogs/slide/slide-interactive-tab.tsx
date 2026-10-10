"use client";

import dynamic from "next/dynamic";
import { Label } from "@/components/ui/label";
import { ISlide } from "@/types/slide";

const MarkdownEditor = dynamic(
  () => import("@/components/markdown/modern-editor"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[26rem] rounded-xl bg-muted/30" aria-hidden />
    ),
  },
);

interface SlideInteractiveTabProps {
  formData: ISlide;
  setFormData: (data: ISlide) => void;
  onOpenImagePicker: () => void;
}

export function SlideInteractiveTab({
  formData,
  setFormData,
  onOpenImagePicker,
}: SlideInteractiveTabProps) {
  return (
    <div className="flex min-h-[28rem] flex-1 flex-col gap-2">
      <Label
        htmlFor="interactive-content"
        className="shrink-0 text-sm font-medium"
      >
        Interactive Content
      </Label>
      <div className="min-h-0 flex-1">
        <MarkdownEditor
          className="h-full min-h-[26rem]"
          value={formData.content || ""}
          onChange={(markdown: string) =>
            setFormData({ ...formData, content: markdown })
          }
          availableImageUrls={(formData.imageUrls || []).filter(
            (u) => !u.startsWith("blob:")
          )}
          openImagePicker={onOpenImagePicker}
        />
      </div>
    </div>
  );
}
