"use client"

import { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, ImageIcon, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getArtistImageUrl } from "@/lib/artist-directory"
import {
  PROFILE_IMAGE_ACCEPT,
  validateProfileImageFile,
} from "@/lib/profile-image-upload"

interface ProfileBannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBannerImage?: string
  onProfileUpdated?: () => void
}

export function ProfileBannerDialog({
  open,
  onOpenChange,
  currentBannerImage = "",
  onProfileUpdated,
}: ProfileBannerDialogProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [removing, setRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) {
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
      setHasError(false)
      setRemoving(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open])

  const handleClose = (nextOpen: boolean, forceClose = false) => {
    if (!nextOpen && hasError && !forceClose) return
    if (!nextOpen && (uploadingImage || removing)) return
    onOpenChange(nextOpen)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateProfileImageFile(file, "Banner photo")
    if (validationError) {
      setHasError(true)
      toast({
        title: "Invalid image",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setHasError(false)
    setSelectedImage(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const hasSavedBanner =
    typeof currentBannerImage === "string" && currentBannerImage.trim() !== ""

  const handleRemoveSelection = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setHasError(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRemoveSavedBanner = async () => {
    setHasError(false)
    setRemoving(true)
    try {
      await apiClient.updateSelfUser({ banner_image: "" })
      toast({
        title: "Banner removed",
        description: "Your profile banner has been removed.",
      })
      await refreshUserData(true)
      await onProfileUpdated?.()
      handleClose(false, true)
    } catch (error: unknown) {
      console.error("[hiffi] Failed to remove banner photo:", error)
      setHasError(true)
      toast({
        title: "Remove failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to remove banner photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRemoving(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedImage) return

    setUploadingImage(true)
    setUploadProgress(0)

    try {
      const uploadUrlResponse = await apiClient.getBannerPhotoUploadUrl()
      if (!uploadUrlResponse.success || !uploadUrlResponse.gateway_url || !uploadUrlResponse.path) {
        throw new Error("Failed to get upload URL")
      }

      setUploadProgress(25)
      await apiClient.uploadFile(uploadUrlResponse.gateway_url, selectedImage, (progress) => {
        setUploadProgress(25 + progress * 0.65)
      })

      setUploadProgress(90)
      await apiClient.updateSelfUser({ banner_image: uploadUrlResponse.path })
      setUploadProgress(100)

      toast({
        title: "Banner updated",
        description: "Your profile banner has been updated successfully.",
      })

      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
      setUploadingImage(false)
      handleClose(false, true)

      setTimeout(async () => {
        try {
          await refreshUserData(true)
          await onProfileUpdated?.()
        } catch (error) {
          console.error("[hiffi] Error refreshing profile data:", error)
        }
      }, 300)
    } catch (error: unknown) {
      console.error("[hiffi] Failed to upload banner photo:", error)
      setHasError(true)
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload banner photo. Please try again.",
        variant: "destructive",
      })
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const savedPreview = hasSavedBanner ? getArtistImageUrl(currentBannerImage) : null
  const displayPreview = imagePreview || savedPreview

  return (
    <Dialog open={open} onOpenChange={(next) => handleClose(next, false)}>
      <DialogContent
        className="sm:max-w-[560px]"
        onInteractOutside={(e) => {
          if (hasError || uploadingImage || removing) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (hasError || uploadingImage || removing) e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Profile banner</DialogTitle>
          <DialogDescription>
            Wide image (~3:1), min width ~1500px, max 10MB. Fans see this on your profile header.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-border bg-zinc-950">
            <div className="relative aspect-[3/1] w-full">
              {displayPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPreview}
                  alt="Banner preview"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#E8192C]/70 via-[#8b0f1c] to-zinc-950 text-white/80">
                  <ImageIcon className="h-8 w-8" aria-hidden />
                  <span className="text-xs font-medium">No banner yet</span>
                </div>
              )}
            </div>
            {(selectedImage || hasSavedBanner) && !uploadingImage && !removing ? (
              <button
                type="button"
                onClick={() => {
                  if (selectedImage) handleRemoveSelection()
                  else void handleRemoveSavedBanner()
                }}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                aria-label={selectedImage ? "Clear selection" : "Remove banner"}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={PROFILE_IMAGE_ACCEPT}
            className="hidden"
            onChange={handleImageSelect}
          />

          {uploadingImage || removing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {removing ? "Removing banner…" : `Uploading… ${Math.round(uploadProgress)}%`}
              </div>
              {!removing ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-[#E8192C] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false, true)}
            disabled={uploadingImage || removing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage || removing}
          >
            {displayPreview ? "Choose different photo" : "Choose photo"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!selectedImage || uploadingImage || removing}
            className="bg-[#E8192C] text-white hover:bg-[#E8192C]/90"
          >
            {uploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload banner"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
