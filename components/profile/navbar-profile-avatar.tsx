"use client"

import { ProfilePicture } from "@/components/profile/profile-picture"
import { getAvatarLetter, getColorFromName, userHasProfilePhoto } from "@/lib/utils"

interface NavbarProfileAvatarProps {
  user: any
}

/** Navbar avatar keeps letter fallback outside Radix to avoid white blank circles. */
export function NavbarProfileAvatar({ user }: NavbarProfileAvatarProps) {
  const showLetter = !userHasProfilePhoto(user)
  const displayName = user?.name || user?.username || "User"
  const letter = getAvatarLetter(user, "U")
  const backgroundColor = getColorFromName(displayName)

  if (showLetter) {
    return (
      <span
        role="img"
        aria-label={`${displayName}'s profile`}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor }}
      >
        {letter}
      </span>
    )
  }

  return <ProfilePicture user={user} size="sm" className="h-8 w-8" />
}
