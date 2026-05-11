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

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter, getProfilePictureProxyUrl } from "@/lib/utils"

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
  const [imageLoadError, setImageLoadError] = useState(false)

  /**
   * `getProfilePictureUrl(..., true)` uses `Date.now()` when `updated_at` is missing, so calling it
   * on every render changes `src` constantly and reloads images (e.g. when a sheet opens and the
   * parent re-renders). Memoize on the fields that actually affect the URL.
   */
  const imageUrl = useMemo(() => {
    if (!user) return ""
    const profilePicUrl = getProfilePictureUrl(user, true)
    return getProfilePictureProxyUrl(profilePicUrl)
  }, [
    user?.profile_picture,
    user?.image,
    user?.updated_at,
    user?.avatarUrl,
    user?.avatar_url,
    user?.avatarurl,
    user?.profilepicture,
    user?.userAvatar,
    user?.user_avatar,
    user?.comment_by_avatar,
    user?.comment_by_avatar_url,
    user?.reply_by_avatar,
    user?.reply_by_avatar_url,
  ])

  useEffect(() => {
    setImageLoadError(false)
  }, [imageUrl])

    if (!user) {
    return (
      <Avatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarFallback className={`text-white font-semibold ${fallbackClassName}`}>
          U
        </AvatarFallback>
      </Avatar>
    )
  }

  const displayName = user?.name || user?.username || "U"
  const avatarLetter = getAvatarLetter(user, "U")
  const backgroundColor = getColorFromName(displayName)

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl && !imageLoadError && (
        <AvatarImage 
          src={imageUrl} 
          alt={`${displayName}'s profile picture`}
          onError={() => setImageLoadError(true)}
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
