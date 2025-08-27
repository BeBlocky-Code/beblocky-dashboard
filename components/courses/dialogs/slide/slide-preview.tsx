"use client";

import { Badge } from "@/components/ui/badge";
import { Layers, Code, ImageIcon, Palette } from "lucide-react";
import { ISlide } from "@/types/slide";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkSupersub from "remark-supersub";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

interface SlidePreviewProps {
  formData: ISlide;
}

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span || []), ["style"]],
    img: [["src"], ["alt"], ["width"], ["height"], ["title"]],
  },
  tagNames: [...(defaultSchema.tagNames || []), "span", "img", "sup", "sub"],
  clobberPrefix: "md-",
} as const;

export function SlidePreview({ formData }: SlidePreviewProps) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4" />
          Slide Preview
        </h4>

        <div
          className="w-full h-48 rounded-lg border p-4 flex flex-col justify-start overflow-hidden"
          style={{
            backgroundColor: formData.backgroundColor || "#ffffff",
          }}
        >
          <h5
            className="font-semibold text-lg mb-2"
            style={{
              color: formData.textColor || "#333333",
              fontFamily: formData.titleFont || "Inter",
            }}
          >
            {formData.title || "Slide Title"}
          </h5>

          {formData.content && (
            <div className="text-sm opacity-80 prose prose-sm dark:prose-invert overflow-y-auto scrollbar-hide max-h-24">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkSupersub]}
                rehypePlugins={[
                  rehypeRaw,
                  [rehypeSanitize, sanitizeSchema] as any,
                ]}
              >
                {formData.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(formData.startingCode || formData.solutionCode) && (
            <Badge
              variant="outline"
              className="flex items-center gap-1"
            >
              <Code className="h-3 w-3" />
              Interactive
            </Badge>
          )}
          {formData.imageUrls && formData.imageUrls.length > 0 && (
            <Badge
              variant="outline"
              className="flex items-center gap-1"
            >
              <ImageIcon className="h-3 w-3" />
              Media
            </Badge>
          )}
          {formData.themeColors && (
            <Badge
              variant="outline"
              className="flex items-center gap-1"
            >
              <Palette className="h-3 w-3" />
              Themed
            </Badge>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800/30">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 Slide Tips
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Keep titles concise and descriptive</li>
          <li>• Use code slides for interactive learning</li>
          <li>• Add images to enhance visual appeal</li>
          <li>• Maintain consistent theme colors</li>
        </ul>
      </div>
    </div>
  );
}
