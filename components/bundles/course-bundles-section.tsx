"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useBundles, useDeleteBundle } from "@/lib/hooks/queries";
import type { BundleResponse } from "@/lib/api/bundle";
import { BundleFormDialog } from "./bundle-form-dialog";
import { toast } from "sonner";

export function CourseBundlesSection() {
  const { data: bundles = [], isLoading, error } = useBundles();
  const deleteMutation = useDeleteBundle();
  const [formOpen, setFormOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<BundleResponse | null>(null);
  const [deleteBundleId, setDeleteBundleId] = useState<string | null>(null);

  if (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to load bundles"
    );
  }

  const handleEdit = (bundle: BundleResponse) => {
    setEditBundle(bundle);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditBundle(null);
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteBundleId) return;
    try {
      await deleteMutation.mutateAsync(deleteBundleId);
      toast.success("Bundle deleted.");
      setDeleteBundleId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete bundle.");
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border border-border/40 bg-card/40 shadow-sm backdrop-blur-sm">
        <CardHeader className="border-b border-border/40 bg-muted/20 pb-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/10">
                <Package className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">
                  Course bundles
                </CardTitle>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Group courses into bundles for the client app
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCreate}
              className="h-9 rounded-full px-4 text-xs font-bold shadow-sm"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Create bundle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No bundles yet</p>
              <Button
                variant="link"
                size="sm"
                className="mt-1"
                onClick={handleCreate}
              >
                Create your first bundle
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {bundles.map((bundle) => {
                const courseIds = bundle.courseIds ?? [];
                const courseCount = Array.isArray(courseIds)
                  ? courseIds.filter(
                      (c) => typeof c === "object" || typeof c === "string"
                    ).length
                  : 0;
                const projectCount = Array.isArray(bundle.projectIds)
                  ? bundle.projectIds.length
                  : 0;
                return (
                  <li
                    key={bundle._id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{bundle.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {courseCount} course{courseCount !== 1 ? "s" : ""}
                          {projectCount > 0 && ` · ${projectCount} project(s)`}
                        </span>
                        {bundle.isPublished && (
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-500/30 bg-emerald-500/10 text-[10px] font-black uppercase tracking-wide text-emerald-700 dark:text-emerald-300"
                          >
                            Published
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleEdit(bundle)}
                        aria-label="Edit bundle"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteBundleId(bundle._id)}
                        aria-label="Delete bundle"
                        className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <BundleFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditBundle(null);
        }}
        editBundle={editBundle}
      />

      <AlertDialog
        open={!!deleteBundleId}
        onOpenChange={() => setDeleteBundleId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-border/40">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The bundle will be removed from the
              list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
