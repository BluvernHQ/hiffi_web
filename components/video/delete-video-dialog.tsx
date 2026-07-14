"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

interface DeleteVideoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  videoId: string
  videoTitle?: string
  onDeleted?: () => void
}

export function DeleteVideoDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  onDeleted,
}: DeleteVideoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  // Radix UI bug: opening a Dialog from inside a DropdownMenu leaves the body with
  // `pointer-events: none` and `data-scroll-locked` after the dialog closes,
  // making the entire page unresponsive. Radix's internal cleanup races with the
  // dropdown's own cleanup and loses. Fix: unconditionally restore body state
  // whenever this dialog transitions to closed.
  useEffect(() => {
    if (open) return
    const restore = () => {
      document.body.style.removeProperty("pointer-events")
      document.body.style.removeProperty("overflow")
      document.body.removeAttribute("data-scroll-locked")
    }
    // Two passes: immediately after state change, and after close animation.
    restore()
    const timer = setTimeout(restore, 300)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    return () => {
      document.body.style.removeProperty("pointer-events")
      document.body.style.removeProperty("overflow")
      document.body.removeAttribute("data-scroll-locked")
    }
  }, [])

  const handleDelete = async () => {
    if (!videoId) return

    try {
      setIsDeleting(true)
      
      const response = await apiClient.deleteVideo(videoId)
      
      if (response.success) {
        toast({
          title: "Video deleted",
          description: "Your video has been deleted successfully.",
        })
        
        onOpenChange(false)
        
        // Give the dialog time to close before calling onDeleted
        // This prevents the parent component from unmounting the dialog
        // before it can clean up body styles (like pointer-events: none)
        // Increased delay to 500ms to be safer across different devices/browsers
        setTimeout(() => {
          onDeleted?.()
        }, 500)
      } else {
        throw new Error(response.message || "Failed to delete video")
      }
    } catch (error: any) {
      console.error("[hiffi] Failed to delete video:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to delete video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Video</DialogTitle>
              <DialogDescription className="mt-1">
                This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            {videoTitle ? (
              <span className="font-semibold text-foreground">&quot;{videoTitle}&quot;</span>
            ) : (
              "this video"
            )}
            ? This will permanently remove the video and all its data.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Video"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
