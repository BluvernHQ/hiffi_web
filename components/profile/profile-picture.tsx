"use client"

/**
 * ProfilePicture Component
 * 
 * A simple, reusable component that automatically fetches and displays user profile pictures.
 * 
 * How it works:
 * 1. Takes user object with profile_picture field
 * 2. Automatically fetches image from Workers with x-api-key header if needed
 * 3. Creates blob URL and displays in Avatar component
 * 4. Shows fallback (colored circle with initial) if image fails
 * 5. Handles cleanup automatically
 * 
 * Usage:
 * ```tsx
 * <ProfilePicture user={user} size="md" />
 * ```
 * 
 * Props:
 * - user: User object with profile_picture, name, username fields
 * - size: "sm" | "md" | "lg" | "xl" (default: "md")
 * - className: Additional CSS classes
 * - fallbackClassName: CSS classes for fallback avatar
 */

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"
import { getWorkersApiKey, WORKERS_BASE_URL } from "@/lib/storage"

interface ProfilePictureProps {
  user: any
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  fallbackClassName?: string
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
}

export function ProfilePicture({ 
  user, 
  className = "", 
  size = "md",
  fallbackClassName = ""
}: ProfilePictureProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!user) {
      setImageUrl(null)
      setIsLoading(false)
      return
    }

    const profilePicUrl = getProfilePictureUrl(user, true)
    
    if (!profilePicUrl) {
      setImageUrl(null)
      setIsLoading(false)
      return
    }

    // If it's a Workers URL, fetch with authentication
    if (profilePicUrl.includes(WORKERS_BASE_URL)) {
      setIsLoading(true)
      
      const apiKey = getWorkersApiKey()
      
      fetch(profilePicUrl, {
        headers: {
          'x-api-key': apiKey,
        },
        cache: 'no-store',
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`)
          }
          return response.blob()
        })
        .then(blob => {
          // Clean up previous blob URL
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current)
          }
          
          const blobUrl = URL.createObjectURL(blob)
          blobUrlRef.current = blobUrl
          setImageUrl(blobUrl)
          setIsLoading(false)
        })
        .catch(error => {
          console.error("[ProfilePicture] Failed to fetch profile picture:", error)
          // Fallback to direct URL (might work if auth not required)
          setImageUrl(profilePicUrl)
          setIsLoading(false)
        })
    } else {
      // Not a Workers URL, use directly
      setImageUrl(profilePicUrl)
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [user?.profile_picture, user?.image, user?.updated_at])

  const displayName = user?.name || user?.username || "U"
  const avatarLetter = getAvatarLetter(user, "U")
  const backgroundColor = getColorFromName(displayName)

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {!isLoading && imageUrl && (
        <AvatarImage 
          src={imageUrl} 
          alt={`${displayName}'s profile picture`}
        />
      )}
      <AvatarFallback 
        className={`text-white font-semibold ${fallbackClassName}`}
        style={{ backgroundColor }}
      >
        {avatarLetter}
      </AvatarFallback>
    </Avatar>
  )
}
