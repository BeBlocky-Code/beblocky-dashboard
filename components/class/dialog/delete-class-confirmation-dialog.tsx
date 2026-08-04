"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteClassConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteClassConfirmationDialog({
  open,
  onOpenChange,
  className,
  onConfirm,
  isLoading = false,
}: DeleteClassConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setConfirmationText("");
      setIsConfirmed(false);
      setCopied(false);
    }
  }, [open]);

  const handleCopyClassName = async () => {
    try {
      await navigator.clipboard.writeText(className);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy class name:", error);
    }
  };

  const handleConfirmationChange = (value: string) => {
    setConfirmationText(value);
    // Trim whitespace and normalize comparison
    const normalizedInput = value.trim().toLowerCase();
    const normalizedClassName = className.trim().toLowerCase();
    const isMatch = normalizedInput === normalizedClassName;

    console.log("Confirmation Debug:", {
      input: value,
      inputLength: value.length,
      normalizedInput,
      normalizedInputLength: normalizedInput.length,
      className,
      classNameLength: className.length,
      normalizedClassName,
      normalizedClassNameLength: normalizedClassName.length,
      isMatch,
      inputCharCodes: [...value].map((c) => c.charCodeAt(0)),
      classNameCharCodes: [...className].map((c) => c.charCodeAt(0)),
    });

    setIsConfirmed(isMatch);
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      // Reset state after confirmation
      setConfirmationText("");
      setIsConfirmed(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state when closing
    setConfirmationText("");
    setIsConfirmed(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Delete Class
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Warning: This will permanently delete the class
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• All student enrollments will be removed</li>
                  <li>• Course assignments will be lost</li>
                  <li>• Class data cannot be recovered</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="confirmation-text">
                Type{" "}
                <span className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1 font-mono font-bold text-destructive">
                  "{className}"
                </span>{" "}
                to confirm
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyClassName}
                disabled={copied}
                className="h-8 rounded-full border-border/40 text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <Input
              id="confirmation-text"
              type="text"
              placeholder={`Type "${className}" to confirm deletion`}
              value={confirmationText}
              onChange={(e) => handleConfirmationChange(e.target.value)}
              className={cn(
                "border-border/40 bg-card/40",
                isConfirmed &&
                  "border-primary/50 bg-muted/20",
                !isConfirmed &&
                  confirmationText &&
                  "border-destructive/50 bg-destructive/10"
              )}
              disabled={isLoading}
            />
            {confirmationText && !isConfirmed && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <span>Class name does not match. Please type exactly:</span>
                <span className="rounded-lg border border-border/40 bg-muted/20 px-2 py-1 font-mono font-bold">
                  "{className}"
                </span>
              </p>
            )}
            {isConfirmed && (
              <p className="flex items-center gap-2 text-sm text-primary">
                <span>Class name matches. You can now delete the class.</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border/40 pt-4">
          <Button variant="outline" className="rounded-full border-border/40" onClick={handleClose} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmed || isLoading}
            className="rounded-full"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete Class
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
