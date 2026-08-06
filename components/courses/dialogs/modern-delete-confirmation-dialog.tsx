"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Trash2, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface ModernDeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  itemToDelete: any
  itemType: "course" | "lesson" | "slide"
  onConfirm: () => void
}

export function ModernDeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  itemToDelete,
  itemType,
  onConfirm,
}: ModernDeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmationValid =
    itemToDelete?.lessonTitle === confirmationText ||
    itemToDelete?.courseTitle === confirmationText ||
    itemToDelete?.title === confirmationText

  const getItemName = () => {
    return itemToDelete?.lessonTitle || itemToDelete?.courseTitle || itemToDelete?.title || ""
  }

  const handleConfirm = async () => {
    if (isConfirmationValid) {
      setIsDeleting(true)
      // Simulate deletion delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      onConfirm()
      setConfirmationText("")
      setIsDeleting(false)
    }
  }

  const getWarningContent = () => {
    switch (itemType) {
      case "course":
        return {
          warning: "This will permanently delete the course and all associated lessons and slides.",
          consequences: [
            "All student progress will be lost",
            "Course materials will be permanently removed",
            "This action cannot be undone",
          ],
        }
      case "lesson":
        return {
          warning: "This will permanently delete the lesson and all associated slides.",
          consequences: [
            "Student progress in this lesson will be lost",
            "All slides will be permanently removed",
            "This action cannot be undone",
          ],
        }
      case "slide":
        return {
          warning: "This will permanently delete the slide.",
          consequences: ["Slide content will be permanently removed", "This action cannot be undone"],
        }
      default:
        return {
          warning: "This action cannot be undone.",
          consequences: [],
        }
    }
  }

  const warningContent = getWarningContent()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto scrollbar-hide rounded-2xl border border-border/40 bg-card/95 backdrop-blur-sm shadow-sm">
        <DialogHeader className="text-center pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10"
          >
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </motion.div>

          <DialogTitle className="text-xl font-bold tracking-tight text-destructive">{title}</DialogTitle>

          <p className="text-muted-foreground mt-2">{warningContent.warning}</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Box */}
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive">Consequences of this action:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {warningContent.consequences.map((consequence, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-destructive"></div>
                      {consequence}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-3">
            <Label htmlFor="confirmationText" className="text-sm font-medium">
              To confirm deletion, type{" "}
              <span className="font-bold text-destructive">{getItemName()}</span>
            </Label>
            <Input
              id="confirmationText"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type ${itemType} name to confirm`}
              className="border-border/40 bg-card/40 focus:ring-2 focus:ring-destructive/20 focus:border-destructive/40"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full border-border/40"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isConfirmationValid || isDeleting}
              className="flex-1 h-10 rounded-full px-5 text-xs font-bold"
            >
              {isDeleting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {itemType}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
