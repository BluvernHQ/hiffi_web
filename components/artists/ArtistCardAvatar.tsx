"use client"

import { useEffect, useState } from "react"
import type { Artist } from "@/lib/artists"
import { artistProfilePhotoAlt } from "@/lib/artists"
import { getArtistImageUrl } from "@/lib/artist-directory"

type ArtistCardAvatarProps = {
  artist: Artist
}

export function ArtistCardAvatar({ artist }: ArtistCardAvatarProps) {
  const [image, setImage] = useState(artist.image)

  useEffect(() => {
    setImage(artist.image)
  }, [artist.image, artist.slug])

  useEffect(() => {
    if (image) return

    let cancelled = false
    void fetch(`/api/artist-index/profile?slug=${encodeURIComponent(artist.slug)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { artist?: Artist } | null) => {
        if (cancelled || !data?.artist?.image) return
        setImage(data.artist.image)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [artist.slug, image])

  const initials = artist.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const imageSrc = getArtistImageUrl(image)

  if (imageSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        alt={artistProfilePhotoAlt(artist.name)}
        className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-lg"
      />
    )
  }

  return (
    <div
      className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-black text-xl font-bold text-white shadow-lg"
      aria-hidden
    >
      {initials}
    </div>
  )
}
