"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Check, X } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  currentUsername: string
  currentBio?: string
  currentLocation?: string
  currentWebsite?: string
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
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [name, setName] = useState(currentName)
  const [username, setUsername] = useState(currentUsername)
  const [bio, setBio] = useState(currentBio)
  const [location, setLocation] = useState(currentLocation)
  const [website, setWebsite] = useState(currentWebsite)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Reset form when dialog opens/closes or current values change
  useEffect(() => {
    if (open) {
      setName(currentName)
      setUsername(currentUsername)
      setBio(currentBio || "")
      setLocation(currentLocation || "")
      setWebsite(currentWebsite || "")
      setUsernameAvailable(null)
    }
  }, [open, currentName, currentUsername, currentBio, currentLocation, currentWebsite])

  // Check username availability
  useEffect(() => {
    // Don't check if username hasn't changed or is empty
    if (username === currentUsername || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    const timer = setTimeout(async () => {
      try {
        const result = await apiClient.checkUsernameAvailability(username)
        if (result.success && result.data) {
          setUsernameAvailable(result.data.available)
        } else {
          setUsernameAvailable(false)
        }
      } catch (error) {
        console.error("[hiffi] Username check failed:", error)
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username, currentUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that at least one field has changed
    const nameChanged = name.trim() !== currentName.trim()
    const usernameChanged = username.toLowerCase() !== currentUsername.toLowerCase()
    const bioChanged = bio.trim() !== (currentBio || "").trim()
    
    if (!nameChanged && !usernameChanged && !bioChanged) {
      toast({
        title: "No changes",
        description: "Please make at least one change before saving.",
        variant: "default",
      })
      return
    }

    // Validate username if it changed
    if (usernameChanged) {
      if (username.length < 3) {
        toast({
          title: "Invalid username",
          description: "Username must be at least 3 characters long.",
          variant: "destructive",
        })
        return
      }

      if (!usernameAvailable) {
        toast({
          title: "Username unavailable",
          description: "This username is already taken. Please choose another one.",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)

    try {
      // Prepare update data - only include changed fields
      const updateData: { name?: string; username?: string; bio?: string } = {}
      if (nameChanged) {
        updateData.name = name.trim()
      }
      if (usernameChanged) {
        updateData.username = username.toLowerCase().trim()
      }
      if (bioChanged) {
        updateData.bio = bio.trim()
      }

      // Update user profile
      await apiClient.updateUser(currentUsername, updateData)
      
      // Refresh user data
      await refreshUserData(true)

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })

      // If username changed, navigate to new profile URL
      if (usernameChanged) {
        router.push(`/profile/${username.toLowerCase().trim()}`)
      } else {
        // Trigger profile refresh callback
        onProfileUpdated?.()
      }

      onOpenChange(false)
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
    username.toLowerCase() !== currentUsername.toLowerCase() ||
    bio.trim() !== (currentBio || "").trim()
  const canSave = hasChanges && (username === currentUsername || usernameAvailable !== false) && !checkingUsername

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
            <div className="relative">
              <Input
                id="username"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                disabled={isLoading}
                className="pr-10"
              />
              {username !== currentUsername && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingUsername ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : usernameAvailable ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-destructive" />
                  )}
                </div>
              )}
            </div>
            {username !== currentUsername && username.length >= 3 && !checkingUsername && (
              <p className={`text-xs ${usernameAvailable ? "text-green-500" : "text-destructive"}`}>
                {usernameAvailable ? "Username is available" : "Username is taken"}
              </p>
            )}
            {username.length > 0 && username.length < 3 && (
              <p className="text-xs text-muted-foreground">
                Username must be at least 3 characters
              </p>
            )}
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

