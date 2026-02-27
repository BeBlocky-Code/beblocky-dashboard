"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Search, Loader2, Image as ImageIcon } from "lucide-react";
import { useCoursesWithDetails, useCreateBundle, useUpdateBundle } from "@/lib/hooks/queries";
import type { BundleResponse, BundleCourse } from "@/lib/api/bundle";
import type { ClientCourse } from "@/lib/api/course";
import { toast } from "sonner";
import { uploadImages } from "@/lib/api/image";

function isPopulatedCourse(c: BundleCourse | string): c is BundleCourse {
  return typeof c === "object" && c !== null && "_id" in c;
}

interface BundleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBundle: BundleResponse | null;
}

export function BundleFormDialog({
  open,
  onOpenChange,
  editBundle,
}: BundleFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: courses = [], isLoading: coursesLoading } = useCoursesWithDetails();
  const createMutation = useCreateBundle();
  const updateMutation = useUpdateBundle();

  const isEdit = !!editBundle;

  useEffect(() => {
    if (!open) return;
    if (editBundle) {
      setName(editBundle.name);
      setDescription(editBundle.description ?? "");
      setIsPublished(editBundle.isPublished ?? false);
      setImageUrl(editBundle.imageUrl ?? null);
      const ids = (editBundle.courseIds ?? []).map((c) =>
        typeof c === "string" ? c : (c as BundleCourse)._id
      );
      setSelectedCourseIds(new Set(ids));
    } else {
      setName("");
      setDescription("");
      setIsPublished(false);
      setSelectedCourseIds(new Set());
      setImageUrl(null);
    }
  }, [open, editBundle]);

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return courses;
    const q = search.toLowerCase();
    return courses.filter(
      (c: ClientCourse) =>
        c.courseTitle?.toLowerCase().includes(q) ||
        c.courseDescription?.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) next.delete(courseId);
      else next.add(courseId);
      return next;
    });
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const [url] = await uploadImages([file]);
      setImageUrl(url);
      toast.success("Image uploaded.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to upload image."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (isEdit && editBundle) {
        await updateMutation.mutateAsync({
          id: editBundle._id,
          payload: {
            name: name.trim(),
            description: description.trim() || undefined,
            imageUrl: imageUrl || undefined,
            courseIds: Array.from(selectedCourseIds),
            isPublished,
          },
        });
        toast.success("Bundle updated.");
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          imageUrl: imageUrl || undefined,
          courseIds: Array.from(selectedCourseIds),
          isPublished,
        });
        toast.success("Bundle created.");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save bundle.");
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending || uploadingImage;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit bundle" : "Create bundle"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bundle-name">Name</Label>
            <Input
              id="bundle-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bundle name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bundle-desc">Description</Label>
            <Input
              id="bundle-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-2">
            <Label>Cover image</Label>
            {imageUrl && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Bundle cover"
                  className="h-14 w-14 rounded-md object-cover border border-slate-200 dark:border-slate-700"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageUrl(null)}
                  disabled={saving}
                >
                  Remove
                </Button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={saving}
                onClick={() => {
                  const input = document.getElementById(
                    "bundle-image-input"
                  ) as HTMLInputElement | null;
                  input?.click();
                }}
              >
                <ImageIcon className="h-4 w-4" />
                {imageUrl ? "Change image" : "Upload image"}
              </Button>
              <input
                id="bundle-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Appears in bundle cards for learners.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="bundle-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
            <Label htmlFor="bundle-published">Published</Label>
          </div>

          <div className="space-y-2">
            <Label>Courses</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-md border border-slate-200 dark:border-slate-700 p-2">
              {coursesLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : filteredCourses.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No courses match.
                </p>
              ) : (
                filteredCourses.map((course: ClientCourse) => (
                  <label
                    key={course._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCourseIds.has(course._id)}
                      onCheckedChange={() => handleToggleCourse(course._id)}
                    />
                    <span className="text-sm font-medium truncate flex-1">
                      {course.courseTitle}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
