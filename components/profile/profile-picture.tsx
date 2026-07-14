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
import { cn, getProfilePictureUrl, getColorFromName, getAvatarLetter, getProfilePictureProxyUrl, userHasProfilePhoto } from "@/lib/utils"

interface ProfilePictureProps {
  user: any
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  fallbackClassName?: string
  /** Show letter avatar even if image path is still stale. */
  forceInitial?: boolean
}

const sizeDimensions = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
} as const

const sizeText = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-xl",
} as const

function ProfileInitial({
  letter,
  backgroundColor,
  displayName,
  className,
  size,
  fallbackClassName,
}: {
  letter: string
  backgroundColor: string
  displayName: string
  className?: string
  size: keyof typeof sizeDimensions
  fallbackClassName?: string
}) {
  return (
    <div
      role="img"
      aria-label={`${displayName}'s profile`}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white",
        sizeDimensions[size],
        sizeText[size],
        className,
        fallbackClassName,
      )}
      style={{ backgroundColor }}
    >
      {letter}
    </div>
  )
}

export function ProfilePicture({ 
  user, 
  className = "", 
  size = "md",
  fallbackClassName = "",
  forceInitial = false,
}: ProfilePictureProps) {
  const [imageLoadError, setImageLoadError] = useState(false)

  /**
   * `getProfilePictureUrl(..., true)` uses `Date.now()` when `updated_at` is missing, so calling it
   * on every render changes `src` constantly and reloads images (e.g. when a sheet opens and the
   * parent re-renders). Memoize on the fields that actually affect the URL.
   */
  const imageUrl = useMemo(() => {
    if (!user || !userHasProfilePhoto(user)) return ""
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

  const hasPhoto = useMemo(() => userHasProfilePhoto(user), [user?.profile_picture, user?.image])

  useEffect(() => {
    setImageLoadError(false)
  }, [imageUrl, hasPhoto])

  if (!user) {
    return <ProfileInitial letter="U" backgroundColor="#f97316" displayName="User" className={className} size={size} fallbackClassName={fallbackClassName} />
  }

  const displayName = user?.name || user?.username || "U"
  const avatarLetter = getAvatarLetter(user, "U")
  const backgroundColor = getColorFromName(displayName)
  const showImage = !forceInitial && hasPhoto && Boolean(imageUrl) && !imageLoadError

  if (!showImage) {
    return (
      <ProfileInitial
        letter={avatarLetter}
        backgroundColor={backgroundColor}
        displayName={displayName}
        className={className}
        size={size}
        fallbackClassName={fallbackClassName}
      />
    )
  }

  return (
    <Avatar className={cn(sizeDimensions[size], className)}>
      <AvatarImage
        src={imageUrl}
        alt={`${displayName}'s profile picture`}
        onError={() => setImageLoadError(true)}
        onLoad={(event) => {
          const img = event.currentTarget
          if (!img.naturalWidth || !img.naturalHeight) {
            setImageLoadError(true)
          }
        }}
      />
      <AvatarFallback 
        className={cn("text-white font-semibold", fallbackClassName)}
        style={{ backgroundColor }}
      >
        {avatarLetter}
      </AvatarFallback>
    </Avatar>
  )
}
