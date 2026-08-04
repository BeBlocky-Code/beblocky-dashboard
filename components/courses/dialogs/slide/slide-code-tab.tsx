"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ISlide } from "@/types/slide";

interface SlideCodeTabProps {
  formData: ISlide;
  setFormData: (data: ISlide) => void;
}

export function SlideCodeTab({
  formData,
  setFormData,
}: SlideCodeTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label
          htmlFor="startingCode"
          className="text-sm font-medium"
        >
          Starting Code
        </Label>
        <Textarea
          id="startingCode"
          value={formData.startingCode || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              startingCode: e.target.value,
            })
          }
          placeholder="Enter starting code for students"
          rows={12}
          className="mt-2 min-h-[14rem] font-mono text-sm border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <Label htmlFor="code" className="text-sm font-medium">
          Solution Code
        </Label>
        <Textarea
          id="code"
          value={formData.solutionCode || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              solutionCode: e.target.value,
            })
          }
          placeholder="Enter solution code"
          rows={12}
          className="mt-2 min-h-[14rem] font-mono text-sm border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
