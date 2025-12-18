"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { marked, type TokensList, type Tokens } from "marked";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import DOMPurify from "dompurify";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Code,
  ImageIcon,
  Italic,
  Bold,
  Superscript,
  Minus,
  Eye,
  Edit3,
  Sparkles,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useTheme } from "next-themes";

type MarkdownEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  className?: string;
  availableImageUrls?: string[];
  openImagePicker?: () => void;
};

type SlashCommand = {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  searchTerms: string[];
  command: () => void;
};


const HtmlAllowedTags = [
  "span",
  "img",
  "sup",
  "sub",
  "br",
];

const decodeHtmlEntities = (input?: string) => {
  if (!input) return "";
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
};

export default function MarkdownEditor({
  value,
  onChange,
  className,
  availableImageUrls = [],
  openImagePicker,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const slashMenuRef = useRef<HTMLDivElement | null>(null);
  const floatingToolbarRef = useRef<HTMLDivElement | null>(null);
  const [localValue, setLocalValue] = useState<string>(value || "");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeLanguage, setCodeLanguage] = useState<"auto" | string>("auto");
  const [externalUrl, setExternalUrl] = useState("");
  const [imgWidth, setImgWidth] = useState("");
  const [imgHeight, setImgHeight] = useState("");
  const [imgAlt, setImgAlt] = useState("");
  const [activeView, setActiveView] = useState<"edit" | "preview" | "split">(
    "split"
  );
  const [isToolbarHovered, setIsToolbarHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [floatingToolbarPosition, setFloatingToolbarPosition] = useState({
    top: 0,
    left: 0,
  });
  const { theme } = useTheme();

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const updateValue = useCallback(
    (next: string) => {
      setLocalValue(next);
      onChange(next);
    },
    [onChange]
  );

  const wrapSelection = useCallback(
    (before: string, after: string = before, placeholder = "text") => {
      const textarea = textareaRef.current;
      if (!textarea) {
        updateValue(localValue + before + placeholder + after);
        return;
      }
      const start = textarea.selectionStart ?? localValue.length;
      const end = textarea.selectionEnd ?? localValue.length;
      const selected = localValue.slice(start, end) || placeholder;
      const next =
        localValue.slice(0, start) +
        before +
        selected +
        after +
        localValue.slice(end);
      updateValue(next);
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos =
          start + before.length + selected.length + after.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [localValue, updateValue]
  );

  const insertAtCursor = useCallback(
    (snippet: string, selectAfter = false) => {
      const textarea = textareaRef.current;
      if (!textarea) {
        updateValue(localValue + snippet);
        return;
      }
      const start = textarea.selectionStart ?? localValue.length;
      const end = textarea.selectionEnd ?? localValue.length;
      const next = localValue.slice(0, start) + snippet + localValue.slice(end);
      updateValue(next);
      requestAnimationFrame(() => {
        if (selectAfter) {
          textarea.setSelectionRange(start, start + snippet.length);
        } else {
          const cursorPos = start + snippet.length;
          textarea.focus();
          textarea.setSelectionRange(cursorPos, cursorPos);
        }
      });
    },
    [localValue, updateValue]
  );

  // External insertion via custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ snippet: string }>;
      if (custom.detail?.snippet) {
        insertAtCursor(custom.detail.snippet);
      }
    };
    document.addEventListener(
      "markdown-editor-insert",
      handler as EventListener
    );
    return () =>
      document.removeEventListener(
        "markdown-editor-insert",
        handler as EventListener
      );
  }, [insertAtCursor]);

  // Convert toolbar functions to markdown syntax
  const insertBold = () => wrapSelection("**", "**", "bold text");
  const insertItalic = () => wrapSelection("*", "*", "italic text");
  const insertSuperscript = () => wrapSelection("<sup>", "</sup>", "x²");
  const insertColor = (color: string) => {
    setSelectedColor(color);
    wrapSelection(`<span style="color:${color}">`, "</span>", "colored text");
  };
  
  const insertHeading = (level: 1 | 2 | 3 = 1) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateValue(`${"#".repeat(level)} ${localValue}`);
      return;
    }
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const beforeSelection = localValue.slice(0, start);
    const afterSelection = localValue.slice(end);
    const selectedText = localValue.slice(start, end) || "Heading";
    const lineStart = beforeSelection.lastIndexOf("\n") + 1;
    const linePrefix = localValue.slice(0, lineStart);
    const lineRemainderBefore = localValue.slice(lineStart, start);
    const headingPrefix = "#".repeat(level) + " ";
    const next = `${linePrefix}${headingPrefix}${lineRemainderBefore}${selectedText}${afterSelection}`;
    updateValue(next);
    requestAnimationFrame(() => {
      const newCursor =
        lineStart + headingPrefix.length + lineRemainderBefore.length + selectedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    });
  };

  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateValue("\n\n```\ncode\n```\n\n");
      return;
    }
    const start = textarea.selectionStart ?? localValue.length;
    const end = textarea.selectionEnd ?? localValue.length;
    const selected = localValue.slice(start, end) || "code";
    const snippet = `\n\n\`\`\`\n${selected}\n\`\`\`\n\n`;
    const next = localValue.slice(0, start) + snippet + localValue.slice(end);
    updateValue(next);
    requestAnimationFrame(() => {
      const cursorPos = start + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertInlineCode = () => {
    wrapSelection("`", "`", "code");
  };

  const insertList = (ordered = false) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateValue(ordered ? "\n1. Item\n" : "\n- Item\n");
      return;
    }
    const start = textarea.selectionStart ?? localValue.length;
    const beforeSelection = localValue.slice(0, start);
    const lineStart = beforeSelection.lastIndexOf("\n") + 1;
    const prefix = ordered ? "1. " : "- ";
    const snippet = `\n${prefix}${localValue.slice(start)}`;
    const next = localValue.slice(0, lineStart) + snippet;
    updateValue(next);
    requestAnimationFrame(() => {
      const cursorPos = lineStart + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      updateValue("\n> Quote\n");
      return;
    }
    const start = textarea.selectionStart ?? localValue.length;
    const end = textarea.selectionEnd ?? localValue.length;
    const selected = localValue.slice(start, end) || "Quote";
    const snippet = `\n> ${selected}\n`;
    const next = localValue.slice(0, start) + snippet + localValue.slice(end);
    updateValue(next);
    requestAnimationFrame(() => {
      const cursorPos = start + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) {
      insertAtCursor("[link text](https://example.com)");
      return;
    }
    const start = textarea.selectionStart ?? localValue.length;
    const end = textarea.selectionEnd ?? localValue.length;
    const selected = localValue.slice(start, end) || "link text";
    const snippet = `[${selected}](https://example.com)`;
    const next = localValue.slice(0, start) + snippet + localValue.slice(end);
    updateValue(next);
    requestAnimationFrame(() => {
      const cursorPos = start + snippet.indexOf("(https") + 1;
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos + "https://example.com".length);
    });
  };

  const insertBreak = () => insertAtCursor("\n\n---\n\n");

  const openCodeDialog = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const selectedText = localValue.slice(start, end);
      setCodeInput(selectedText || codeInput || "");
    }
    setIsCodeDialogOpen(true);
  };

  const closeCodeDialog = () => {
    setIsCodeDialogOpen(false);
    setCodeInput("");
    setCodeLanguage("auto");
  };

  const guessLanguage = (code: string): string | undefined => {
    const snippet = code.slice(0, 500).toLowerCase();
    if (/\bimport\s+react\b|<\/?[a-z][^>]*>/.test(code)) return "jsx";
    if (/console\.log\(|function\s+|=>|\bvar\b|\blet\b|\bconst\b/.test(code))
      return "javascript";
    if (/^\s*#include\b|std::|<iostream>/.test(code)) return "cpp";
    if (
      /^\s*using\s+system|namespace\s+[a-z0-9_]+\s*;|class\s+[A-Z]/i.test(code)
    )
      return "csharp";
    if (/\bdef\s+\w+\(|\bimport\s+\w+|:\n\s+\w+\s*=/.test(code))
      return "python";
    if (/\bpackage\s+[\w.]+;|public\s+class\s+/.test(code)) return "java";
    if (/\bfn\s+\w+\(|\blet\s+mut\b|::/.test(code)) return "rust";
    if (/\bSELECT\b|\bFROM\b|\bWHERE\b/i.test(snippet)) return "sql";
    if (/<!DOCTYPE\s+html>|<html\b|<div\b|<span\b/i.test(code)) return "html";
    return undefined;
  };

  const insertCodeFromDialog = () => {
    const lang =
      codeLanguage === "auto" ? guessLanguage(codeInput) : codeLanguage;
    const langLabel = lang && lang !== "auto" ? lang : "";
    const snippet = `\n\n\`\`\`${langLabel}\n${codeInput}\n\`\`\`\n\n`;
    insertAtCursor(snippet);
    closeCodeDialog();
  };

  const openLocalPicker = () => setIsPickerOpen(true);
  const closeLocalPicker = () => setIsPickerOpen(false);

  const insertImage = (
    url: string,
    width?: string,
    height?: string,
    alt?: string
  ) => {
    const widthAttr = width ? ` width="${width}"` : "";
    const heightAttr = height ? ` height="${height}"` : "";
    insertAtCursor(
      `\n<img src="${url}" alt="${alt || ""}"${widthAttr}${heightAttr} />\n`
    );
    closeLocalPicker();
    setExternalUrl("");
    setImgWidth("");
    setImgHeight("");
    setImgAlt("");
  };

  // Handle removing slash command text before inserting command
  const removeSlashCommand = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = localValue.slice(0, cursorPos);
    const lastLine = textBeforeCursor.split("\n").pop() || "";

    if (lastLine.startsWith("/")) {
      const lineStart = textBeforeCursor.lastIndexOf("\n") + 1;
      const textAfterCursor = localValue.slice(cursorPos);
      const newValue = localValue.slice(0, lineStart) + textAfterCursor;
      updateValue(newValue);
      
      // Set cursor position after removing slash command
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, lineStart);
      });
    }
  }, [localValue, updateValue]);

  // Slash commands
  const slashCommands: SlashCommand[] = useMemo(
    () => [
      {
        title: "Heading 1",
        description: "Big section heading",
        icon: Heading1,
        searchTerms: ["h1", "heading", "title", "big"],
        command: () => {
          removeSlashCommand();
          insertHeading(1);
          setShowSlashMenu(false);
        },
      },
      {
        title: "Heading 2",
        description: "Medium section heading",
        icon: Heading2,
        searchTerms: ["h2", "heading", "subtitle", "medium"],
        command: () => {
          removeSlashCommand();
          insertHeading(2);
          setShowSlashMenu(false);
        },
      },
      {
        title: "Heading 3",
        description: "Small section heading",
        icon: Heading3,
        searchTerms: ["h3", "heading", "subtitle", "small"],
        command: () => {
          removeSlashCommand();
          insertHeading(3);
          setShowSlashMenu(false);
        },
      },
      {
        title: "Bold",
        description: "Make text bold",
        icon: Bold,
        searchTerms: ["bold", "strong", "b"],
        command: () => {
          removeSlashCommand();
          insertBold();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Italic",
        description: "Make text italic",
        icon: Italic,
        searchTerms: ["italic", "emphasis", "i"],
        command: () => {
          removeSlashCommand();
          insertItalic();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Code Block",
        description: "Insert a code block",
        icon: Code,
        searchTerms: ["code", "block", "snippet"],
        command: () => {
          removeSlashCommand();
          insertCodeBlock();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Inline Code",
        description: "Insert inline code",
        icon: Code,
        searchTerms: ["code", "inline", "backtick"],
        command: () => {
          removeSlashCommand();
          insertInlineCode();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Bullet List",
        description: "Create a bullet list",
        icon: List,
        searchTerms: ["list", "bullet", "unordered"],
        command: () => {
          removeSlashCommand();
          insertList(false);
          setShowSlashMenu(false);
        },
      },
      {
        title: "Numbered List",
        description: "Create a numbered list",
        icon: ListOrdered,
        searchTerms: ["list", "numbered", "ordered", "number"],
        command: () => {
          removeSlashCommand();
          insertList(true);
          setShowSlashMenu(false);
        },
      },
      {
        title: "Quote",
        description: "Insert a blockquote",
        icon: Quote,
        searchTerms: ["quote", "blockquote", "citation"],
        command: () => {
          removeSlashCommand();
          insertQuote();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Link",
        description: "Insert a link",
        icon: LinkIcon,
        searchTerms: ["link", "url", "href", "anchor"],
        command: () => {
          removeSlashCommand();
          insertLink();
          setShowSlashMenu(false);
        },
      },
      {
        title: "Image",
        description: "Insert an image",
        icon: ImageIcon,
        searchTerms: ["image", "img", "picture", "photo"],
        command: () => {
          removeSlashCommand();
          setShowSlashMenu(false);
          openImagePicker ? openImagePicker() : openLocalPicker();
        },
      },
      {
        title: "Horizontal Rule",
        description: "Insert a horizontal rule",
        icon: Minus,
        searchTerms: ["hr", "rule", "divider", "separator"],
        command: () => {
          removeSlashCommand();
          insertBreak();
          setShowSlashMenu(false);
        },
      },
    ],
    [removeSlashCommand]
  );

  // Filter slash commands based on query
  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return slashCommands;
    const fuse = new Fuse(slashCommands, {
      keys: ["title", "description", "searchTerms"],
      threshold: 0.3,
      minMatchCharLength: 1,
    });
    return fuse.search(slashQuery).map((result) => result.item);
  }, [slashQuery, slashCommands]);

  // Handle slash command menu
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleInput = (e: KeyboardEvent | React.KeyboardEvent) => {
      const target = e.target as HTMLTextAreaElement;
      if (target !== textarea) return;

      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = localValue.slice(0, cursorPos);
      const lastLine = textBeforeCursor.split("\n").pop() || "";

      if (lastLine === "/" || (lastLine.startsWith("/") && !lastLine.includes(" ") && !lastLine.endsWith(" "))) {
        const query = lastLine.slice(1);
        setSlashQuery(query);
        
        // Calculate position for slash menu
        const textareaRect = textarea.getBoundingClientRect();
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        const lines = textBeforeCursor.split("\n").length;
        const top = textareaRect.top + (lines * lineHeight) + 25;
        const left = textareaRect.left + 20;

        setSlashPosition({ top, left });
        setShowSlashMenu(true);
      } else {
        setShowSlashMenu(false);
      }
    };

    textarea.addEventListener("keyup", handleInput as EventListener);
    return () => {
      textarea.removeEventListener("keyup", handleInput as EventListener);
    };
  }, [localValue]);

  // Handle floating toolbar on selection
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelection = () => {
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && textarea.selectionStart !== textarea.selectionEnd) {
        // Calculate position above selection
        const start = textarea.selectionStart;
        const textBefore = localValue.slice(0, start);
        const lines = textBefore.split("\n").length;
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
        
        // Get approximate position (this is a simplified version)
        const textareaRect = textarea.getBoundingClientRect();
        const top = textareaRect.top + (lines * lineHeight) - 40;
        const left = textareaRect.left + 20;

        setFloatingToolbarPosition({ top, left });
        setShowFloatingToolbar(true);
      } else {
        setShowFloatingToolbar(false);
      }
    };

    textarea.addEventListener("mouseup", handleSelection);
    textarea.addEventListener("keyup", handleSelection);
    textarea.addEventListener("select", handleSelection);

    return () => {
      textarea.removeEventListener("mouseup", handleSelection);
      textarea.removeEventListener("keyup", handleSelection);
      textarea.removeEventListener("select", handleSelection);
    };
  }, [localValue]);

  // Auto-close pairs
  const handleAutoClose = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (start !== end) return; // Don't auto-close if text is selected

      const pairs: Record<string, string> = {
        "`": "`",
        "*": "*",
        "_": "_",
        "[": "]",
      };

      const char = e.key;
      if (pairs[char]) {
        e.preventDefault();
        const before = localValue.slice(0, start);
        const after = localValue.slice(end);
        const next = before + char + pairs[char] + after;
        updateValue(next);
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(start + 1, start + 1);
        });
      }
    },
    [localValue, updateValue]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const textData = e.dataTransfer.getData("text/plain");
      const url = textData?.trim();
      if (url && /^(https?:|\/)/.test(url) && !url.startsWith("blob:")) {
        insertAtCursor(`\n<img src="${url}" alt="" />\n`);
        return;
      }
    },
    [insertAtCursor]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle Escape to close menus
      if (e.key === "Escape") {
        setShowSlashMenu(false);
        setShowFloatingToolbar(false);
        return;
      }

      // Handle slash menu navigation
      if (showSlashMenu && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
        e.preventDefault();
        return;
      }

      // Auto-close pairs
      handleAutoClose(e);

      // Keyboard shortcuts
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        insertBold();
      }
      if (isMod && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        insertItalic();
      }
      if (isMod && e.key === "k") {
        e.preventDefault();
        insertLink();
      }
    },
    [showSlashMenu, handleAutoClose, insertBold, insertItalic, insertLink]
  );

  // Configure marked
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  // Parse markdown tokens for rendering
  const parsedTokens = useMemo<TokensList>(() => {
    const value = localValue?.length ? localValue : "*Start typing to see your preview...*";
    return marked.lexer(value);
  }, [localValue]);

  const renderedMarkdown = useMemo(
    () => renderMarkdownTokens(parsedTokens, theme),
    [parsedTokens, theme]
  );

  const toolbarButtons = [
    {
      icon: Heading1,
      action: () => insertHeading(1),
      tooltip: "Heading 1",
      shortcut: "",
    },
    {
      icon: Bold,
      action: insertBold,
      tooltip: "Bold (Ctrl/Cmd+B)",
      shortcut: "⌘B",
    },
    {
      icon: Italic,
      action: insertItalic,
      tooltip: "Italic (Ctrl/Cmd+I)",
      shortcut: "⌘I",
    },
    {
      icon: Superscript,
      action: insertSuperscript,
      tooltip: "Superscript",
      shortcut: "",
    },
    {
      icon: Code,
      action: openCodeDialog,
      tooltip: "Code Block",
      shortcut: "",
    },
    { icon: Minus, action: insertBreak, tooltip: "Horizontal Rule (---)", shortcut: "" },
  ];

  return (
    <TooltipProvider>
      <div className={className}>
        {/* Code Snippet Dialog */}
        <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
          <DialogContent className="sm:max-w-[800px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Insert Code Snippet
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                >
                  <Code className="h-3 w-3 mr-1" /> Code
                </Badge>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value as any)}
                  className="h-9 rounded-md border bg-transparent px-2 text-sm"
                >
                  <option value="auto">Auto</option>
                  <option value="javascript">JavaScript</option>
                  <option value="typescript">TypeScript</option>
                  <option value="jsx">JSX / TSX</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="cpp">C/C++</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                  <option value="ruby">Ruby</option>
                  <option value="php">PHP</option>
                  <option value="swift">Swift</option>
                  <option value="kotlin">Kotlin</option>
                  <option value="sql">SQL</option>
                  <option value="bash">Bash</option>
                  <option value="html">HTML</option>
                  <option value="css">CSS</option>
                  <option value="json">JSON</option>
                  <option value="yaml">YAML</option>
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Code
                  </label>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste or write your code here"
                    className="w-full h-56 p-3 font-mono text-sm bg-white/70 dark:bg-slate-800/70 border rounded-md resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Preview
                  </label>
                  <div className="w-full h-56 p-3 bg-slate-950/90 text-slate-100 rounded-md overflow-auto">
                    {codeInput ? (
                      <SyntaxHighlighter
                        language={codeLanguage === "auto" ? guessLanguage(codeInput) || "text" : codeLanguage}
                        style={theme === "dark" ? oneDark : oneLight}
                        customStyle={{ margin: 0, background: "transparent" }}
                      >
                        {codeInput}
                      </SyntaxHighlighter>
                    ) : (
                      <pre className="text-xs leading-5 text-muted-foreground">
                        <code>// Your code preview will appear here</code>
                      </pre>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeCodeDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={insertCodeFromDialog}
                  disabled={!codeInput.trim()}
                  className="bg-gradient-to-r from-primary to-secondary text-white"
                >
                  Insert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Slash Command Menu */}
        {showSlashMenu && (
          <div
            ref={slashMenuRef}
            className="fixed z-50"
            style={{
              top: `${slashPosition.top}px`,
              left: `${slashPosition.left}px`,
            }}
          >
            <Command className="w-64 border shadow-lg bg-popover">
              <CommandList>
                <CommandEmpty>No commands found</CommandEmpty>
                {filteredSlashCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.title}
                    onSelect={() => cmd.command()}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded border bg-secondary">
                      <cmd.icon size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{cmd.title}</span>
                      <span className="text-muted-foreground text-xs">
                        {cmd.description}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </div>
        )}

        {/* Floating Toolbar */}
        <AnimatePresence>
          {showFloatingToolbar && (
            <motion.div
              ref={floatingToolbarRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed z-50 flex items-center gap-1 rounded-lg border bg-background p-1 shadow-lg"
              style={{
                top: `${floatingToolbarPosition.top}px`,
                left: `${floatingToolbarPosition.left}px`,
              }}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertBold}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertItalic}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertInlineCode}
                className="h-8 w-8 p-0"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={insertLink}
                className="h-8 w-8 p-0"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onHoverStart={() => setIsToolbarHovered(true)}
          onHoverEnd={() => setIsToolbarHovered(false)}
        >
          <Card className="p-4 mb-6 bg-gradient-to-r from-white/80 via-slate-50/80 to-white/80 dark:from-slate-900/80 dark:via-slate-800/80 dark:to-slate-900/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Formatting Buttons */}
                <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-white/20">
                  {toolbarButtons.map((button, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={button.action}
                            className="h-9 w-9 p-0 hover:bg-primary/10 transition-all duration-200 hover:text-primary"
                          >
                            <button.icon className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-center">
                          <div className="font-medium">{button.tooltip}</div>
                          {button.shortcut && (
                            <div className="text-xs text-muted-foreground">
                              {button.shortcut}
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                <Separator
                  orientation="vertical"
                  className="h-6 bg-border/50"
                />

                {/* Color Picker */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="p-1 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-white/20">
                      <ColorPicker
                        value={selectedColor}
                        onChange={insertColor}
                        className="h-9 w-9"
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Text Color</TooltipContent>
                </Tooltip>

                <Separator
                  orientation="vertical"
                  className="h-6 bg-border/50"
                />

                {/* Image Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openImagePicker
                            ? openImagePicker()
                            : openLocalPicker()
                        }
                        className="h-9 px-3 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Image
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>Insert Image</TooltipContent>
                </Tooltip>
              </div>

              {/* View Toggle & Badge */}
              <div className="flex items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 rounded-lg backdrop-blur-sm border border-white/20">
                  <Button
                    type="button"
                    variant={activeView === "edit" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("edit")}
                    className="h-8 px-3 text-xs"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={activeView === "split" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("split")}
                    className="h-8 px-3 text-xs"
                  >
                    <Type className="h-3 w-3 mr-1" />
                    Split
                  </Button>
                  <Button
                    type="button"
                    variant={activeView === "preview" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveView("preview")}
                    className="h-8 px-3 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                </div>

                {/* Markdown Badge */}
                <motion.div
                  animate={{ scale: isToolbarHovered ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg">
                    <Code className="h-3 w-3 mr-1" />
                    <Sparkles className="h-3 w-3 mr-1" />
                    Markdown
                  </Badge>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Editor Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-0 shadow-xl">
            <div
              className={`grid gap-0 ${activeView === "split" ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {/* Editor Pane */}
              <AnimatePresence>
                {(activeView === "edit" || activeView === "split") && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative min-h-[320px]"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <Badge
                        variant="outline"
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Editor
                      </Badge>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={localValue}
                      onChange={(e) => updateValue(e.target.value)}
                      onDrop={onDrop}
                      onKeyDown={onKeyDown}
                      className="w-full h-80 p-6 pt-16 text-sm font-mono bg-transparent border-0 resize-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                      placeholder="Start writing your markdown here... 

✨ Use **bold** and *italic* text
🎨 Add colors with the palette tool
📷 Insert images with drag & drop
⌨️ Use Ctrl/Cmd+B for bold, Ctrl/Cmd+I for italic
💡 Type / for commands"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview Pane */}
              <AnimatePresence>
                {(activeView === "preview" || activeView === "split") && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="relative min-h-[320px] md:border-l md:border-border/50"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Badge
                        variant="outline"
                        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Badge>
                    </div>
                    <div className="h-80 p-6 pt-16 overflow-auto prose prose-sm dark:prose-invert max-w-none prose-headings:text-slate-900 dark:prose-headings:text-white prose-p:text-slate-700 dark:prose-p:text-slate-300 min-h-[320px] prose-img:max-w-full prose-img:h-auto">
                      {renderedMarkdown}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>

        {/* Enhanced Image Picker Dialog */}
        <Dialog
          open={isPickerOpen && !openImagePicker}
          onOpenChange={setIsPickerOpen}
        >
          <DialogContent className="sm:max-w-[700px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Insert Image
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {availableImageUrls.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Your Images
                  </h4>
                  <div className="grid grid-cols-3 gap-3 max-h-60 overflow-auto p-1">
                    {availableImageUrls.map((url, index) => (
                      <motion.button
                        key={url}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        className="relative border-2 border-transparent rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                        onClick={() => insertImage(url)}
                      >
                        <img
                          src={url || "/placeholder.svg"}
                          alt="uploaded"
                          className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-slate-700" />
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-secondary" />
                  External Image
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Image URL
                    </label>
                    <Input
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Width
                    </label>
                    <Input
                      value={imgWidth}
                      onChange={(e) => setImgWidth(e.target.value)}
                      placeholder="200"
                      className="mt-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Height
                    </label>
                    <Input
                      value={imgHeight}
                      onChange={(e) => setImgHeight(e.target.value)}
                      placeholder="100"
                      className="mt-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Alt Text
                    </label>
                    <Input
                      value={imgAlt}
                      onChange={(e) => setImgAlt(e.target.value)}
                      placeholder="Describe the image for accessibility"
                      className="mt-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-border/50"
                    />
                  </div>
                </div>
              </motion.div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeLocalPicker}
                  className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    externalUrl &&
                    insertImage(externalUrl, imgWidth, imgHeight, imgAlt)
                  }
                  disabled={!externalUrl}
                  className="bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Insert Image
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
function renderMarkdownTokens(tokens: TokensList, theme?: string): React.ReactNode {
  const renderInline = (inlineTokens?: Tokens.Generic[]): React.ReactNode => {
    if (!inlineTokens) return null;
    return inlineTokens.map((token, index) => {
      switch (token.type) {
        case "strong":
          return <strong key={`strong-${index}`}>{renderInline(token.tokens)}</strong>;
        case "em":
          return <em key={`em-${index}`}>{renderInline(token.tokens)}</em>;
        case "codespan":
          return (
            <code key={`codespan-${index}`} className="rounded bg-muted px-1 py-0.5">
              {decodeHtmlEntities(token.text)}
            </code>
          );
        case "link":
          return (
            <a key={`link-${index}`} href={token.href || "#"} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
              {renderInline(token.tokens)}
            </a>
          );
        case "image":
          if (!token.href) return null;
          return (
            <img
              key={`img-${index}`}
              src={token.href}
              alt={token.text || ""}
              className="inline-block max-w-full h-auto"
            />
          );
        case "br":
          return <br key={`br-${index}`} />;
        case "del":
          return <del key={`del-${index}`}>{renderInline(token.tokens)}</del>;
        case "html": {
          if (!HtmlAllowedTags.some((tag) => token.text?.includes(`<${tag}`))) {
            return null;
          }
          return (
            <span
              key={`inline-html-${index}`}
              dangerouslySetInnerHTML={{
                __html:
                  typeof window !== "undefined"
                    ? DOMPurify.sanitize(token.text || "", {
                        ALLOWED_TAGS: HtmlAllowedTags,
                        ALLOWED_ATTR: ["style", "src", "alt", "width", "height", "title"],
                      })
                    : token.text || "",
              }}
            />
          );
        }
        case "text":
          if (token.tokens) {
            return <span key={`text-${index}`}>{renderInline(token.tokens)}</span>;
          }
          return <span key={`text-${index}`}>{decodeHtmlEntities(token.text)}</span>;
        default:
          return token.raw ?? null;
      }
    });
  };

  const renderBlocks = (blockTokens: TokensList): React.ReactNode => {
    return blockTokens.map((token, index) => {
      switch (token.type) {
        case "heading": {
          const Tag = `h${token.depth}` as keyof JSX.IntrinsicElements;
          return (
            <Tag key={`heading-${index}`} className="font-semibold mt-4">
              {renderInline(token.tokens)}
            </Tag>
          );
        }
        case "paragraph":
          return (
            <p key={`paragraph-${index}`} className="mt-2">
              {renderInline(token.tokens)}
            </p>
          );
        case "text":
          return (
            <p key={`text-block-${index}`} className="mt-2">
              {renderInline(token.tokens)}
            </p>
          );
        case "list": {
          const ListTag = token.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={`list-${index}`}
              className={`ml-6 mt-2 ${token.ordered ? "list-decimal" : "list-disc"}`}
            >
              {token.items.map((item, itemIndex) => (
                <li key={`list-item-${index}-${itemIndex}`} className="mb-1">
                  {renderInline(item.tokens)}
                  {item.tokens && item.tokens.length === 0 && item.text}
                </li>
              ))}
            </ListTag>
          );
        }
        case "blockquote":
          return (
            <blockquote
              key={`blockquote-${index}`}
              className="border-l-4 border-muted pl-4 italic my-4 text-muted-foreground"
            >
              {renderInline(token.tokens)}
            </blockquote>
          );
        case "code":
          return (
            <div key={`code-${index}`} className="my-4">
              <SyntaxHighlighter
                language={token.lang || "text"}
                style={theme === "dark" ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                }}
                PreTag="div"
              >
                {decodeHtmlEntities(token.text)}
              </SyntaxHighlighter>
            </div>
          );
        case "hr":
          return <hr key={`hr-${index}`} className="my-6 border-muted" />;
        case "html": {
          return (
            <div
              key={`html-${index}`}
              dangerouslySetInnerHTML={{
                __html:
                  typeof window !== "undefined"
                    ? DOMPurify.sanitize(token.text || "", {
                        ALLOWED_TAGS: ["p", "div", ...HtmlAllowedTags],
                        ALLOWED_ATTR: ["style", "src", "alt", "width", "height", "title"],
                      })
                    : token.text || "",
              }}
            />
          );
        }
        case "table": {
          return (
            <div key={`table-${index}`} className="my-4 overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead>
                  <tr>
                    {token.header.map((header, headerIndex) => (
                      <th key={`th-${index}-${headerIndex}`} className="border border-border px-3 py-2 text-left">
                        {renderInline(header.tokens)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {token.rows.map((row, rowIndex) => (
                    <tr key={`row-${index}-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`td-${index}-${rowIndex}-${cellIndex}`} className="border border-border px-3 py-2">
                          {renderInline(cell.tokens)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        default:
          return null;
      }
    });
  };

  return <div className="markdown-preview space-y-3">{renderBlocks(tokens)}</div>;
}