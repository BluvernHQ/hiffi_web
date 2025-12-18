"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Camera, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"

interface ProfilePictureEditorProps {
  currentProfilePicture?: string
  currentName: string
  currentUsername: string
  onProfileUpdated?: () => void
}

export function ProfilePictureEditor({
  currentProfilePicture = "",
  currentName,
  currentUsername,
  onProfileUpdated,
}: ProfilePictureEditorProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()

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
      await apiClient.updateSelf({ profile_picture: uploadedImagePath })
      setUploadProgress(100)

      // Refresh user data
      await refreshUserData(true)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Reset state
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)

      // Trigger profile refresh callback
      onProfileUpdated?.()

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      })
    } catch (error: any) {
      console.error("[hiffi] Failed to upload profile photo:", error)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const handleCancel = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Get current profile picture URL for preview
  const currentProfilePictureUrl = currentProfilePicture || ""
  const cacheBustingUrl = currentProfilePictureUrl 
    ? `${getProfilePictureUrl({ profile_picture: currentProfilePictureUrl, updated_at: new Date().toISOString() })}&_cb=${Date.now()}`
    : null
  const displayPreview = imagePreview || cacheBustingUrl

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage 
              src={displayPreview || undefined}
              key={`avatar-${currentProfilePictureUrl}-${imagePreview ? 'preview' : 'current'}`}
            />
            <AvatarFallback 
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{
                backgroundColor: getColorFromName(currentName || currentUsername || "U"),
              }}
            >
              {getAvatarLetter({ name: currentName, username: currentUsername }, "U")}
            </AvatarFallback>
          </Avatar>
          {imagePreview && (
            <div className="absolute inset-0 rounded-full border-4 border-primary bg-primary/10" />
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
                onClick={handleCancel}
                disabled={uploadingImage}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
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
      {selectedImage && !uploadingImage && (
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleUpload}
            size="sm"
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Save Photo
          </Button>
        </div>
      )}
    </div>
  )
}
