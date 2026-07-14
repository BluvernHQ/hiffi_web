import type { Artist } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"
import { cn } from "@/lib/utils"

type ArtistAvatarProps = {
  artist: Artist
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
}

export function ArtistAvatar({ artist, size = "md", className }: ArtistAvatarProps) {
  const initials = artist.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const imageSrc = getArtistImageUrl(artist.image)

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeClasses[size],
          !artist.verified && artist.claim_status === "unclaimed" && "grayscale opacity-70",
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        artist.verified
          ? "bg-[#E8192C]/10 text-[#E8192C]"
          : "bg-muted text-muted-foreground",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
