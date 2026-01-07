"use client"

import { useState, useEffect } from "react"
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
  const [otpId, setOtpId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const { refreshUserData } = useAuth()
  const { toast } = useToast()

  // Reset form when dialog opens/closes or current values change
  useEffect(() => {
    if (open) {
      setName(currentName)
      setEmail(currentEmail || "")
      setBio(currentBio || "")
      setOtpId(null)
      setOtp("")
      setIsVerifying(false)
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
        const response = await apiClient.updateSelfUser(updateData)
        
        // Check if response indicates OTP was sent (email change)
        // Response structure: { success: true, data: { id: "...", message: "..." } }
        if (emailChanged && response && (response as any).data?.id) {
          const otpResponse = response as any
          setOtpId(otpResponse.data.id)
          
          toast({
            title: "OTP sent",
            description: otpResponse.data.message || "Please check your email for the OTP code.",
          })
          
          setIsLoading(false)
          return // Don't close dialog, show OTP input
        }
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otpId) {
      toast({
        title: "Error",
        description: "OTP verification ID is missing. Please try again.",
        variant: "destructive",
      })
      return
    }
    
    // Validate OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    try {
      // Verify email update OTP
      const response = await apiClient.verifyEmailUpdate({
        id: otpId,
        otp: otp,
      })

      if (response.success) {
        toast({
          title: "Email verified",
          description: "Your email has been successfully updated.",
        })

        // Close dialog
        setIsVerifying(false)
        onOpenChange(false)

        // Refresh data in background
        Promise.all([
          refreshUserData(true),
          onProfileUpdated?.()
        ]).catch(error => {
          console.error("[hiffi] Error refreshing profile data:", error)
        })
      } else {
        throw new Error(response.error || "OTP verification failed")
      }
    } catch (error: any) {
      console.error("[hiffi] Failed to verify OTP:", error)
      const errorMessage = error.message || "OTP verification failed. Please try again."
      
      toast({
        title: "Verification failed",
        description: errorMessage,
        variant: "destructive",
      })
      
      // Clear OTP on error so user can retry
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  const hasChanges = 
    name.trim() !== currentName.trim() || 
    email.trim() !== (currentEmail || "").trim() ||
    bio.trim() !== (currentBio || "").trim()
  const emailChanged = email.trim() !== (currentEmail || "").trim()
  const canSave = hasChanges

  // Show OTP verification form if OTP was sent
  if (otpId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Verify your email</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit code to {email}. Please enter it below to complete the email update.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                  setOtp(value)
                }}
                autoComplete="off"
                required
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
                disabled={isVerifying}
              />
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your new email address
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOtpId(null)
                  setOtp("")
                  setIsVerifying(false)
                }}
                disabled={isVerifying}
              >
                Back
              </Button>
              <Button type="submit" disabled={isVerifying || otp.length !== 6}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

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
                  {emailChanged ? "Sending OTP..." : "Saving..."}
                </>
              ) : (
                emailChanged ? "Send OTP" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

