"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Camera, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentUsername: string
  currentBio?: string
  currentLocation?: string
  currentWebsite?: string
  currentProfilePicture?: string
  onProfileUpdated?: () => void
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
  currentUsername,
  currentBio = "",
  currentLocation = "",
  currentWebsite = "",
  currentProfilePicture = "",
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName)
  const [bio, setBio] = useState(currentBio)
  const [location, setLocation] = useState(currentLocation)
  const [website, setWebsite] = useState(currentWebsite)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Reset form when dialog opens/closes or current values change
  useEffect(() => {
    if (open) {
      setName(currentName)
      setBio(currentBio || "")
      setLocation(currentLocation || "")
      setWebsite(currentWebsite || "")
      setSelectedImage(null)
      setImagePreview(null)
      setUploadProgress(0)
    }
  }, [open, currentName, currentBio, currentLocation, currentWebsite, currentProfilePicture])

  // Force refresh of profile picture when currentProfilePicture changes
  // Use a combination of the path and timestamp to ensure fresh image loads
  const getProfilePictureKey = () => {
    if (!currentProfilePicture) return 0
    // Use path + timestamp to create unique key for cache busting
    return `${currentProfilePicture}-${Date.now()}`
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one field has changed
    const nameChanged = name.trim() !== currentName.trim()
    const bioChanged = bio.trim() !== (currentBio || "").trim()
    const imageChanged = selectedImage !== null
    
    if (!nameChanged && !bioChanged && !imageChanged) {
      toast({
        title: "No changes",
        description: "Please make at least one change before saving.",
        variant: "default",
      })
      return
    }

    setIsLoading(true)
    let uploadedImagePath: string | undefined = undefined

    try {
      // Upload profile photo if selected
      if (selectedImage) {
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
            // Progress from 25% to 90% (25% + 65% of upload)
            setUploadProgress(25 + (progress * 0.65))
          })

          setUploadProgress(90)
          uploadedImagePath = uploadUrlResponse.path
          setUploadProgress(100)
        } catch (error: any) {
          console.error("[hiffi] Failed to upload profile photo:", error)
          toast({
            title: "Upload failed",
            description: error.message || "Failed to upload profile photo. Please try again.",
            variant: "destructive",
          })
          setUploadingImage(false)
          setIsLoading(false)
          return
        } finally {
          setUploadingImage(false)
          setUploadProgress(0)
        }
      }

      // Update user profile using updateSelf (all updates go through /users/self)
      const updateData: { name?: string; profile_picture?: string; bio?: string } = {}
      
      if (nameChanged) {
        updateData.name = name.trim()
      }
      
      if (bioChanged) {
        updateData.bio = bio.trim()
      }
      
      if (uploadedImagePath) {
        updateData.profile_picture = uploadedImagePath
      }

      // Update all fields via updateSelf
      if (Object.keys(updateData).length > 0) {
        await apiClient.updateSelf(updateData)
      }
      
      // Refresh user data first to get updated profile picture
      await refreshUserData(true)
      
      // Small delay to ensure state updates propagate and API responds
      await new Promise(resolve => setTimeout(resolve, 300))

      // Trigger profile refresh callback to update parent component
      onProfileUpdated?.()

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      // Close dialog after a brief delay to allow for state updates
      setTimeout(() => {
        onOpenChange(false)
        // Reset image selection after dialog closes
        setSelectedImage(null)
        setImagePreview(null)
      }, 300)
    } catch (error: any) {
      console.error("[hiffi] Failed to update profile:", error)
      const errorMessage = error.message || "Failed to update profile. Please try again."
      
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const hasChanges = 
    name.trim() !== currentName.trim() || 
    bio.trim() !== (currentBio || "").trim() ||
    selectedImage !== null
  const canSave = hasChanges && !uploadingImage

  // Get current profile picture URL for preview with cache busting
  const currentProfilePictureUrl = currentProfilePicture || ""
  // Add timestamp for cache busting when dialog opens
  const cacheBustingUrl = currentProfilePictureUrl 
    ? `${getProfilePictureUrl({ profile_picture: currentProfilePictureUrl, updated_at: new Date().toISOString() })}&_cb=${Date.now()}`
    : null
  const displayPreview = imagePreview || cacheBustingUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information. All fields are optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Profile Photo Upload */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-border">
                  <AvatarImage 
                    src={displayPreview || undefined}
                    key={`avatar-${getProfilePictureKey()}-${imagePreview ? 'preview' : 'current'}`}
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
                    disabled={isLoading || uploadingImage}
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
                      disabled={isLoading || uploadingImage}
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
                  disabled={isLoading || uploadingImage}
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

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder={currentUsername}
              value={currentUsername}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Username cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={isLoading}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

