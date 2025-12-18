"use client";

import { Badge } from "@/components/ui/badge";
import { Layers, Code, ImageIcon, Palette } from "lucide-react";
import { ISlide } from "@/types/slide";
import { marked } from "marked";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import DOMPurify from "dompurify";
import { useTheme } from "next-themes";
import { useMemo, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

interface SlidePreviewProps {
  formData: ISlide;
}

export function SlidePreview({ formData }: SlidePreviewProps) {
  const { theme } = useTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  // Configure marked
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  // Render markdown content
  const renderMarkdown = useMemo(() => {
    if (!formData.content) return null;

    try {
      const html = marked.parse(formData.content, {
        breaks: true,
        gfm: true,
      }) as string;

      // Sanitize HTML (only allow img, span, sup, sub tags)
      // DOMPurify needs to run in browser context
      const sanitized = typeof window !== "undefined"
        ? DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ["p", "h1", "h2", "h3", "h4", "h5", "h6", "strong", "em", "ul", "ol", "li", "blockquote", "code", "pre", "a", "img", "span", "sup", "sub", "br", "hr"],
            ALLOWED_ATTR: ["href", "src", "alt", "width", "height", "title", "style", "class"],
            ALLOW_DATA_ATTR: false,
          })
        : html; // Fallback to unsanitized HTML if running in SSR

      return sanitized;
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return "<p>Error parsing markdown</p>";
    }
  }, [formData.content]);

  // Extract code blocks and apply syntax highlighting
  useEffect(() => {
    if (!contentRef.current) return;

    if (!renderMarkdown) {
      contentRef.current.innerHTML = "";
      return;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(renderMarkdown, "text/html");
    const codeBlocks = doc.querySelectorAll("pre code");
    
    // Store code block data before replacing
    const codeBlockData: Array<{ text: string; language: string }> = [];

    codeBlocks.forEach((codeBlock) => {
      const text = codeBlock.textContent || "";
      const className = codeBlock.className || "";
      const langMatch = className.match(/language-(\w+)/);
      const language = langMatch ? langMatch[1] : "text";
      
      codeBlockData.push({ text, language });

      // Replace code block with placeholder
      const placeholder = doc.createElement("div");
      placeholder.setAttribute("data-code-block", String(codeBlockData.length - 1));
      placeholder.className = "syntax-highlighter-placeholder";
      codeBlock.parentElement?.replaceChild(placeholder, codeBlock);
    });

    // Update content with placeholders (or direct HTML if no code blocks)
    contentRef.current.innerHTML = doc.body.innerHTML;

    // Replace placeholders with syntax highlighted code
    if (codeBlockData.length > 0) {
      const placeholders = contentRef.current.querySelectorAll(
        ".syntax-highlighter-placeholder"
      );

      placeholders.forEach((placeholder) => {
        const blockIndex = placeholder.getAttribute("data-code-block");
        const index = blockIndex ? parseInt(blockIndex, 10) : -1;
        
        if (index < 0 || index >= codeBlockData.length) return;

        const { text, language } = codeBlockData[index];

        // Create wrapper for syntax highlighter
        const wrapper = document.createElement("div");
        wrapper.className = "relative my-2";
        placeholder.parentElement?.replaceChild(wrapper, placeholder);

        // Render syntax highlighter
        const root = createRoot(wrapper);
        root.render(
          <SyntaxHighlighter
            language={language}
            style={theme === "dark" ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: "0.375rem",
              fontSize: "0.75rem",
            }}
            PreTag="div"
          >
            {text}
          </SyntaxHighlighter>
        );
      });
    }
  }, [renderMarkdown, theme]);

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
            <div
              ref={contentRef}
              className="text-sm opacity-80 prose prose-sm dark:prose-invert overflow-y-auto scrollbar-hide max-h-24"
            />
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
