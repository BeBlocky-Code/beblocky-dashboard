"use client";

import { Label } from "@/components/ui/label";
import { ISlide } from "@/types/slide";
import MarkdownEditor from "@/components/markdown/modern-editor";

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
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="interactive-content"
          className="text-sm font-medium"
        >
          Interactive Content
        </Label>
        <div className="mt-2">
          <MarkdownEditor
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
    </div>
  );
}
