"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter, fetchProfilePictureWithAuth } from "@/lib/utils"

interface ProfilePictureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentProfilePicture?: string
  currentName: string
  currentUsername: string
  onProfileUpdated?: () => void
}

export function ProfilePictureDialog({
  open,
  onOpenChange,
  currentProfilePicture = "",
  currentName,
  currentUsername,
  onProfileUpdated,
}: ProfilePictureDialogProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()
  const [currentProfilePictureBlobUrl, setCurrentProfilePictureBlobUrl] = useState<string | null>(null)

  // Track the last uploaded image path to keep preview until profile updates
  const [lastUploadedPath, setLastUploadedPath] = useState<string | null>(null)
  
  // Reset preview tracking when dialog closes
  useEffect(() => {
    if (!open) {
      setLastUploadedPath(null)
    }
  }, [open])
  
  // Fetch fresh profile picture when dialog opens or currentProfilePicture changes
  useEffect(() => {
    // Store previous blob URL for cleanup
    let previousBlobUrl: string | null = null
    
    if (!open || !currentProfilePicture) {
      // Clean up blob URL
      if (currentProfilePictureBlobUrl) {
        URL.revokeObjectURL(currentProfilePictureBlobUrl)
        setCurrentProfilePictureBlobUrl(null)
      }
      return
    }
    
    // Store current blob URL before fetching new one
    previousBlobUrl = currentProfilePictureBlobUrl
    
    // Always fetch fresh - don't cache
    const profilePicUrl = getProfilePictureUrl({ 
      profile_picture: currentProfilePicture,
      updated_at: new Date().toISOString()
    }, true)
    
    if (profilePicUrl && profilePicUrl.includes('black-paper-83cf.hiffi.workers.dev')) {
      // Fetch with auth and create blob URL (always fresh)
      fetchProfilePictureWithAuth(profilePicUrl)
        .then(blobUrl => {
          // Clean up previous blob URL
          if (previousBlobUrl && previousBlobUrl !== blobUrl) {
            URL.revokeObjectURL(previousBlobUrl)
          }
          setCurrentProfilePictureBlobUrl(blobUrl)
        })
        .catch(error => {
          console.error("[dialog] Failed to fetch profile picture with auth:", error)
          // Clean up on error
          if (previousBlobUrl) {
            URL.revokeObjectURL(previousBlobUrl)
          }
          setCurrentProfilePictureBlobUrl(null)
        })
    } else {
      // Not a Workers URL, clear blob URL
      if (previousBlobUrl) {
        URL.revokeObjectURL(previousBlobUrl)
      }
      setCurrentProfilePictureBlobUrl(null)
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      // Cleanup will be handled by next effect run or component unmount
    }
  }, [open, currentProfilePicture])
  
  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (currentProfilePictureBlobUrl) {
        URL.revokeObjectURL(currentProfilePictureBlobUrl)
      }
    }
  }, [currentProfilePictureBlobUrl])

  // Reset state when dialog closes
  const handleClose = (open: boolean) => {
    if (!open) {
      // Reset all state when dialog closes
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
      setLastUploadedPath(null)
      // Clean up blob URL
      if (currentProfilePictureBlobUrl) {
        URL.revokeObjectURL(currentProfilePictureBlobUrl)
        setCurrentProfilePictureBlobUrl(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    onOpenChange(open)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type - only JPG allowed
    const validTypes = ['image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Only JPG images are allowed for profile photos.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Profile photo must be less than 10MB.",
        variant: "destructive",
      })
      return
    }

    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedImage) return

    setUploadingImage(true)
    setUploadProgress(0)

    try {
      // Step 1: Get upload URL
      const uploadUrlResponse = await apiClient.getProfilePhotoUploadUrl()
      if (!uploadUrlResponse.success || !uploadUrlResponse.gateway_url || !uploadUrlResponse.path) {
        throw new Error("Failed to get upload URL")
      }

      // Step 2: Upload image to gateway URL
      setUploadProgress(25)
      await apiClient.uploadFile(uploadUrlResponse.gateway_url, selectedImage, (progress) => {
        setUploadProgress(25 + (progress * 0.65))
      })

      setUploadProgress(90)
      const uploadedImagePath = uploadUrlResponse.path

      // Step 3: Update profile with new picture
      // API expects: PUT /users/self with body { "profile_picture": path }
      await apiClient.updateSelf({ profile_picture: uploadedImagePath })
      setUploadProgress(100)

      // Store the uploaded path so we can track when profile updates
      setLastUploadedPath(uploadedImagePath)

      // Show success toast immediately
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      })

      // Close dialog immediately - no delays
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
      setUploadingImage(false)
      handleClose(false)

      // Refresh data immediately to update navbar
      // Use a small delay to ensure the backend has processed the update
      setTimeout(async () => {
        try {
          // Clear auth context cache to force fresh fetch
          if (typeof window !== "undefined") {
            localStorage.removeItem("hiffi_user_data");
            localStorage.removeItem("hiffi_user_data_timestamp");
          }
          // Refresh user data FIRST to update navbar immediately
          console.log("[ProfilePictureDialog] Refreshing user data to update navbar...")
          await refreshUserData(true)
          // Dispatch custom event to notify navbar of profile picture update
          // This ensures navbar updates even if userData object reference doesn't change
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent('profilePictureUpdated'))
          }
          // Then call onProfileUpdated to trigger version increment on profile page
          await onProfileUpdated?.()
        } catch (error) {
          console.error("[hiffi] Error refreshing profile data:", error)
        }
      }, 300) // Small delay to allow backend to process
    } catch (error: any) {
      console.error("[hiffi] Failed to upload profile photo:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      })
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  // Get current profile picture URL for preview
  // Priority: imagePreview (newly selected/uploaded) > currentProfilePictureBlobUrl (fetched fresh) > currentProfilePicture (fallback)
  // Always prefer imagePreview if it exists (user selected new image)
  const displayPreview = imagePreview || currentProfilePictureBlobUrl || null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
          <DialogDescription>
            Upload a new profile picture. JPG format only, max 10MB.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage 
                  src={displayPreview || undefined}
                  key={`avatar-dialog-${imagePreview ? 'preview' : currentProfilePicture || 'none'}-${selectedImage ? 'selected' : 'current'}-${Date.now()}`}
                  alt="Profile picture preview"
                />
                <AvatarFallback 
                  className="text-xl font-bold text-white"
                  style={{
                    backgroundColor: getColorFromName(currentName || currentUsername || "U"),
                  }}
                >
                  {getAvatarLetter({ name: currentName, username: currentUsername }, "U")}
                </AvatarFallback>
              </Avatar>
              {imagePreview && (
                <div className="absolute inset-0 rounded-full border-2 border-primary bg-primary/10" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {selectedImage ? "Change Photo" : "Upload Photo"}
                </Button>
                {selectedImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Remove
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg"
                onChange={handleImageSelect}
                className="hidden"
                disabled={uploadingImage}
              />
              <p className="text-xs text-muted-foreground">
                JPG only, max 10MB
              </p>
              {uploadingImage && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading... {Math.round(uploadProgress)}%
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={uploadingImage}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleUpload}
            disabled={!selectedImage || uploadingImage}
          >
            {uploadingImage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save Photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
