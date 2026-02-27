"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import type { BundleResponse, BundleCourse } from "@/lib/api/bundle";
import { BundleFormDialog } from "./bundle-form-dialog";
import { toast } from "sonner";

function isPopulatedCourse(c: BundleCourse | string): c is BundleCourse {
  return typeof c === "object" && c !== null && "_id" in c;
}

export function CourseBundlesSection() {
  const { data: bundles = [], isLoading, error } = useBundles();
  const deleteMutation = useDeleteBundle();
  const [formOpen, setFormOpen] = useState(false);
  const [editBundle, setEditBundle] = useState<BundleResponse | null>(null);
  const [deleteBundleId, setDeleteBundleId] = useState<string | null>(null);

  if (error) {
    toast.error(error instanceof Error ? error.message : "Failed to load bundles");
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
      <Card className="border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Course bundles</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Group courses into bundles for the client app.
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create bundle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : bundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
              <Package className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No bundles yet.</p>
              <Button variant="link" size="sm" className="mt-2" onClick={handleCreate}>
                Create your first bundle
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {bundles.map((bundle) => {
                const courseIds = bundle.courseIds ?? [];
                const courseCount = Array.isArray(courseIds)
                  ? courseIds.filter((c) => typeof c === "object" || typeof c === "string").length
                  : 0;
                const projectCount = Array.isArray(bundle.projectIds)
                  ? bundle.projectIds.length
                  : 0;
                return (
                  <li
                    key={bundle._id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium">{bundle.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {courseCount} course{courseCount !== 1 ? "s" : ""}
                        {projectCount > 0 && ` · ${projectCount} project(s)`}
                        {bundle.isPublished && (
                          <span className="ml-2 text-primary">· Published</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
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
                        className="text-destructive hover:text-destructive"
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

      <AlertDialog open={!!deleteBundleId} onOpenChange={() => setDeleteBundleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The bundle will be removed from the list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
