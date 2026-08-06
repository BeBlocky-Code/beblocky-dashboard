"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ISlide } from "@/types/slide";

interface SlideThemeTabProps {
  formData: ISlide;
  setFormData: (data: ISlide) => void;
}

export function SlideThemeTab({
  formData,
  setFormData,
}: SlideThemeTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">
            Background Color
          </Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="color"
              value={formData.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  backgroundColor: e.target.value,
                })
              }
              className="w-16 h-10 p-1 border-border/40 bg-card/40 rounded"
            />
            <Input
              value={formData.backgroundColor || "#ffffff"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  backgroundColor: e.target.value,
                })
              }
              placeholder="#ffffff"
              className="flex-1 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Text Color</Label>
          <div className="mt-2 flex gap-2">
            <Input
              type="color"
              value={formData.textColor || "#333333"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  textColor: e.target.value,
                })
              }
              className="w-16 h-10 p-1 border-border/40 bg-card/40 rounded"
            />
            <Input
              value={formData.textColor || "#333333"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  textColor: e.target.value,
                })
              }
              placeholder="#333333"
              className="flex-1 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Theme Colors</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">
              Main Color
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                type="color"
                value={formData.themeColors?.main || "#892FFF"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeColors: {
                      main: e.target.value,
                      secondary:
                        formData.themeColors?.secondary ||
                        "#FF932C",
                    },
                  })
                }
                className="w-16 h-10 p-1 border-border/40 bg-card/40 rounded"
              />
              <Input
                value={formData.themeColors?.main || "#892FFF"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeColors: {
                      main: e.target.value,
                      secondary:
                        formData.themeColors?.secondary ||
                        "#FF932C",
                    },
                  })
                }
                placeholder="#892FFF"
                className="flex-1 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">
              Secondary Color
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                type="color"
                value={formData.themeColors?.secondary || "#FF932C"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeColors: {
                      main: formData.themeColors?.main || "#892FFF",
                      secondary: e.target.value,
                    },
                  })
                }
                className="w-16 h-10 p-1 border-border/40 bg-card/40 rounded"
              />
              <Input
                value={formData.themeColors?.secondary || "#FF932C"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    themeColors: {
                      main: formData.themeColors?.main || "#892FFF",
                      secondary: e.target.value,
                    },
                  })
                }
                placeholder="#FF932C"
                className="flex-1 border-border/40 bg-card/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
