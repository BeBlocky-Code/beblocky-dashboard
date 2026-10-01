"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Flag, Plus, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ILesson } from "@/types/lesson";
import type {
  AuthoringChallenge,
  ChallengeKind,
  ChallengeWriteBody,
} from "@/lib/api/challenge";

type FormState = {
  lessonId: string;
  kind: ChallengeKind;
  prompt: string;
  choices: string[];
  correctChoiceIndexes: number[];
  hiddenTests: string[];
};

function emptyForm(lessonId: string): FormState {
  return {
    lessonId,
    kind: "mcq",
    prompt: "",
    choices: ["", ""],
    correctChoiceIndexes: [],
    hiddenTests: [""],
  };
}

function fromChallenge(challenge: AuthoringChallenge): FormState {
  return {
    lessonId: challenge.lessonId,
    kind: challenge.kind,
    prompt: challenge.prompt ?? "",
    choices:
      challenge.choices && challenge.choices.length > 0
        ? [...challenge.choices]
        : ["", ""],
    correctChoiceIndexes: [...(challenge.correctChoiceIndexes ?? [])],
    hiddenTests:
      challenge.hiddenTests && challenge.hiddenTests.length > 0
        ? [...challenge.hiddenTests]
        : [""],
  };
}

interface ChallengeEditorPanelProps {
  mode: "create" | "edit";
  challenge: AuthoringChallenge | null;
  courseId: string;
  lessons: ILesson[];
  defaultLessonId?: string | null;
  isSaving?: boolean;
  onSave: (body: ChallengeWriteBody, lessonId: string) => Promise<void>;
  onCancelCreate?: () => void;
}

export function ChallengeEditorPanel({
  mode,
  challenge,
  lessons,
  defaultLessonId,
  isSaving = false,
  onSave,
  onCancelCreate,
}: ChallengeEditorPanelProps) {
  const firstLessonId = lessons[0]?._id?.toString() || "";
  const [form, setForm] = useState<FormState>(
    emptyForm(defaultLessonId || firstLessonId),
  );

  useEffect(() => {
    if (challenge) {
      setForm(fromChallenge(challenge));
    } else {
      setForm(emptyForm(defaultLessonId || firstLessonId));
    }
  }, [challenge, defaultLessonId, firstLessonId, mode]);

  const setKind = (kind: ChallengeKind) => {
    setForm((prev) => ({ ...prev, kind }));
  };

  const toggleCorrect = (index: number) => {
    setForm((prev) => {
      const set = new Set(prev.correctChoiceIndexes);
      if (set.has(index)) set.delete(index);
      else set.add(index);
      return { ...prev, correctChoiceIndexes: [...set].sort((a, b) => a - b) };
    });
  };

  const validate = () => {
    const errors: string[] = [];
    if (!form.lessonId) errors.push("Pick a lesson");
    if (!form.prompt.trim()) errors.push("Prompt is required");
    if (form.kind === "mcq") {
      const filled = form.choices.map((c) => c.trim());
      if (filled.filter(Boolean).length < 2) {
        errors.push("MCQ needs at least two choices");
      }
      if (form.correctChoiceIndexes.length === 0) {
        errors.push("Mark at least one correct choice");
      }
    } else if (form.hiddenTests.every((row) => !row.trim())) {
      errors.push("Add at least one hidden test");
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }
    const body: ChallengeWriteBody =
      form.kind === "code"
        ? {
            kind: "code",
            prompt: form.prompt.trim(),
            hiddenTests: form.hiddenTests.map((row) => row.trim()).filter(Boolean),
          }
        : (() => {
            const filled = form.choices
              .map((row, index) => ({ text: row.trim(), index }))
              .filter((row) => row.text);
            const indexMap = new Map(
              filled.map((row, next) => [row.index, next]),
            );
            return {
              kind: "mcq" as const,
              prompt: form.prompt.trim(),
              choices: filled.map((row) => row.text),
              correctChoiceIndexes: form.correctChoiceIndexes
                .map((index) => indexMap.get(index))
                .filter((index): index is number => index !== undefined),
            };
          })();
    await onSave(body, form.lessonId);
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">
              {mode === "edit" ? "Edit Challenge" : "Create New Challenge"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Attach an MCQ or code check to a lesson. Learners never see the
              answers or hidden tests.
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

        <div className="space-y-4 max-w-2xl">
          <div>
            <Label className="text-sm font-medium">Lesson</Label>
            <Select
              value={form.lessonId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, lessonId: value }))
              }
              disabled={mode === "edit"}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => {
                  const id = lesson._id?.toString() || "";
                  return (
                    <SelectItem key={id} value={id}>
                      {lesson.title || "Untitled lesson"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Type</Label>
            <div className="mt-2 grid grid-cols-2 max-w-xs bg-muted/50 p-1.5 rounded-full border border-border/40">
              {(["mcq", "code"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setKind(kind)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-tight transition-[color,background-color,transform] duration-150",
                    "active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    form.kind === kind
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {kind === "mcq" ? "MCQ" : "Code"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="challengePrompt" className="text-sm font-medium">
              Prompt
            </Label>
            <Textarea
              id="challengePrompt"
              value={form.prompt}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, prompt: e.target.value }))
              }
              placeholder="What should the learner do?"
              rows={4}
              className="mt-2"
              required
            />
          </div>

          {form.kind === "mcq" ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choices</Label>
              {form.choices.map((choice, index) => {
                const correct = form.correctChoiceIndexes.includes(index);
                return (
                  <div key={index} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={correct}
                      aria-label={
                        correct ? "Unmark as correct" : "Mark as correct"
                      }
                      onClick={() => toggleCorrect(index)}
                      className={cn(
                        "h-10 shrink-0 rounded-full border px-3 text-xs font-bold uppercase transition-[color,background-color,border-color] duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        correct
                          ? "border-transparent bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted/70",
                      )}
                    >
                      {correct ? "Correct" : "Mark"}
                    </button>
                    <Input
                      value={choice}
                      onChange={(e) => {
                        const next = [...form.choices];
                        next[index] = e.target.value;
                        setForm((prev) => ({ ...prev, choices: next }));
                      }}
                      placeholder={`Choice ${index + 1}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove choice ${index + 1}`}
                      className="h-10 w-10 text-muted-foreground hover:text-destructive"
                      disabled={form.choices.length <= 2}
                      onClick={() => {
                        const next = form.choices.filter((_, i) => i !== index);
                        const correctNext = form.correctChoiceIndexes
                          .filter((i) => i !== index)
                          .map((i) => (i > index ? i - 1 : i));
                        setForm((prev) => ({
                          ...prev,
                          choices: next,
                          correctChoiceIndexes: correctNext,
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4 text-xs font-bold"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    choices: [...prev.choices, ""],
                  }))
                }
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Add choice
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Hidden tests</Label>
              <p className="text-xs text-muted-foreground">
                Each line runs in the same VM as the learner’s code. Throw to
                fail.
              </p>
              {form.hiddenTests.map((test, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Textarea
                    value={test}
                    onChange={(e) => {
                      const next = [...form.hiddenTests];
                      next[index] = e.target.value;
                      setForm((prev) => ({ ...prev, hiddenTests: next }));
                    }}
                    placeholder="if (exports.answer !== 4) throw new Error('no')"
                    rows={2}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove hidden test ${index + 1}`}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                    disabled={form.hiddenTests.length <= 1}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        hiddenTests: prev.hiddenTests.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full px-4 text-xs font-bold"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    hiddenTests: [...prev.hiddenTests, ""],
                  }))
                }
              >
                <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                Add test
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/60 px-6 py-4 flex items-center justify-between gap-3">
        <Badge variant="secondary" className="rounded-full">
          <Flag className="h-3 w-3 mr-1" aria-hidden="true" />
          {form.kind === "mcq" ? "Multiple choice" : "Code check"}
        </Badge>
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
              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
            />
          ) : (
            <Save className="h-4 w-4 mr-2" aria-hidden="true" />
          )}
          {isSaving
            ? mode === "edit"
              ? "Saving..."
              : "Creating..."
            : mode === "edit"
              ? "Save Changes"
              : "Create New Challenge"}
        </Button>
      </div>
    </form>
  );
}
