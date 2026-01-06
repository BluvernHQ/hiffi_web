"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mail } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentUsername: string
  currentEmail?: string
  currentBio?: string
  onProfileUpdated?: () => void
}

export function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
  currentUsername,
  currentEmail = "",
  currentBio = "",
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName)
  const [email, setEmail] = useState(currentEmail)
  const [bio, setBio] = useState(currentBio)
  const [isLoading, setIsLoading] = useState(false)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Reset form when dialog opens/closes or current values change
  useEffect(() => {
    if (open) {
      setName(currentName)
      setEmail(currentEmail || "")
      setBio(currentBio || "")
    }
  }, [open, currentName, currentEmail, currentBio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email format if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }
    
    // Validate that at least one field has changed
    const nameChanged = name.trim() !== currentName.trim()
    const emailChanged = email.trim() !== (currentEmail || "").trim()
    const bioChanged = bio.trim() !== (currentBio || "").trim()
    
    if (!nameChanged && !emailChanged && !bioChanged) {
      toast({
        title: "No changes",
        description: "Please make at least one change before saving.",
        variant: "default",
      })
      return
    }

    setIsLoading(true)

    try {
      // Update user profile using updateSelf (all updates go through /users/self)
      const updateData: { name?: string; email?: string; bio?: string } = {}
      
      if (nameChanged) {
        updateData.name = name.trim()
      }
      
      if (emailChanged) {
        updateData.email = email.trim()
      }
      
      if (bioChanged) {
        updateData.bio = bio.trim()
      }

      // Update all fields via updateSelfUser (all updates go through /users/self)
      if (Object.keys(updateData).length > 0) {
        await apiClient.updateSelfUser(updateData)
      }

      // Show success toast immediately
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      // Close dialog immediately - no delays
      setIsLoading(false)
      onOpenChange(false)

      // Refresh data in background after dialog closes to prevent flickering
      Promise.all([
        refreshUserData(true),
        onProfileUpdated?.()
      ]).catch(error => {
        console.error("[hiffi] Error refreshing profile data:", error)
      })
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
    }
  }

  const hasChanges = 
    name.trim() !== currentName.trim() || 
    email.trim() !== (currentEmail || "").trim() ||
    bio.trim() !== (currentBio || "").trim()
  const canSave = hasChanges

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile Details</DialogTitle>
          <DialogDescription>
            Update your profile information. All fields are optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your email address for account notifications
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

