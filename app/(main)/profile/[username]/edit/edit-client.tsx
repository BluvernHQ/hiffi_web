"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"
import {
  EditArtistProfileForm,
  socialsFromProfile,
} from "@/components/profile/edit-artist-profile-form"
import { ProfilePictureDialog } from "@/components/profile/profile-picture-dialog"
import { ProfileBannerDialog } from "@/components/profile/profile-banner-dialog"
import type { Artist } from "@/lib/artists"
import { Button } from "@/components/ui/button"

type EditProfileClientProps = {
  initialProfileUser?: Record<string, unknown> | null
  initialArtist?: Artist | null
}

async function fetchArtistForUsername(username: string): Promise<Artist | null> {
  try {
    const response = await fetch(
      `/api/artist-index/profile?slug=${encodeURIComponent(username.toLowerCase())}`,
      { cache: "no-store" },
    )
    if (!response.ok) return null
    const data = (await response.json()) as { artist?: Artist }
    return data.artist ?? null
  } catch {
    return null
  }
}

export default function EditProfileClient({
  initialProfileUser = null,
  initialArtist = null,
}: EditProfileClientProps) {
  const params = useParams()
  const router = useRouter()
  const username = String(params.username || "").trim()
  const { user, userData, loading: authLoading, refreshUserData } = useAuth()

  const [profileUser, setProfileUser] = useState<any>(initialProfileUser)
  const [artist, setArtist] = useState<Artist | null>(initialArtist)
  // SSR seed can be up to ~5 min stale — always refresh before treating the editor as ready.
  const [loading, setLoading] = useState(true)
  const [pictureOpen, setPictureOpen] = useState(false)
  const [bannerOpen, setBannerOpen] = useState(false)

  const isOwnProfile = Boolean(
    userData?.username &&
      username &&
      userData.username.toLowerCase() === username.toLowerCase(),
  )

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(`/profile/${username}/edit`)}`)
      return
    }
    if (userData?.username && userData.username.toLowerCase() !== username.toLowerCase()) {
      router.replace(`/profile/${encodeURIComponent(username)}`)
    }
  }, [authLoading, user, userData?.username, username, router])

  useEffect(() => {
    if (!username) return
    let cancelled = false

    void (async () => {
      setLoading(true)
      try {
        const [userRes, nextArtist] = await Promise.all([
          apiClient.getUserByUsername(username),
          fetchArtistForUsername(username),
        ])
        if (cancelled) return
        if (userRes.user) setProfileUser(userRes.user)
        setArtist(nextArtist)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [username])

  const refreshProfile = async () => {
    await refreshUserData(true)
    const [userRes, nextArtist] = await Promise.all([
      apiClient.getUserByUsername(username),
      fetchArtistForUsername(username),
    ])
    if (userRes.user) setProfileUser(userRes.user)
    setArtist(nextArtist)
    router.refresh()
  }

  const socials = useMemo(() => {
    const base = socialsFromProfile(profileUser as Record<string, unknown>)
    if (!artist) return base
    // Prefer live user fields; only fill gaps from Artist Index inventory.
    return {
      ...base,
      currentLocation:
        base.currentLocation ||
        [artist.city, artist.state].filter(Boolean).join(", "),
      currentInstagram: base.currentInstagram || artist.ig_url || "",
      currentYoutube: base.currentYoutube || artist.yt_url || "",
      currentTiktok: base.currentTiktok || artist.tt_url || "",
      currentFacebook: base.currentFacebook || artist.fb_url || "",
      currentSpotify: base.currentSpotify || artist.spotify_url || "",
    }
  }, [profileUser, artist])

  if (authLoading || loading || !profileUser) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading editor…
      </div>
    )
  }

  if (!isOwnProfile) {
    return (
      <div className="mx-auto flex h-full max-w-md items-center px-4 py-16 text-center">
        <div className="w-full">
          <h1 className="text-xl font-semibold">You can only edit your own profile</h1>
          <Button asChild className="mt-6">
            <Link href={`/profile/${encodeURIComponent(username)}`}>Back to profile</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EditArtistProfileForm
        key={String(profileUser.updated_at || profileUser.username || username)}
        currentName={profileUser.name || profileUser.username || ""}
        currentUsername={profileUser.username || username}
        currentEmail={profileUser.email || userData?.email || ""}
        currentBio={profileUser.bio || ""}
        currentProfilePicture={profileUser.profile_picture || ""}
        currentBannerImage={
          (typeof profileUser.banner_image === "string" && profileUser.banner_image) ||
          (typeof profileUser.cover_image === "string" && profileUser.cover_image) ||
          (typeof artist?.banner_image === "string" && artist.banner_image) ||
          ""
        }
        genreLabel={artist?.genre?.join(" / ") || "Rap / Hip-Hop"}
        verified={Boolean(artist?.verified)}
        {...socials}
        onOpenPictureEditor={() => setPictureOpen(true)}
        onOpenBannerEditor={() => setBannerOpen(true)}
        onProfileUpdated={refreshProfile}
      />
      <ProfilePictureDialog
        open={pictureOpen}
        onOpenChange={setPictureOpen}
        currentProfilePicture={profileUser.profile_picture || ""}
        currentName={profileUser.name || profileUser.username || ""}
        currentUsername={profileUser.username || username}
        onProfileUpdated={refreshProfile}
      />
      <ProfileBannerDialog
        open={bannerOpen}
        onOpenChange={setBannerOpen}
        currentBannerImage={
          (typeof profileUser.banner_image === "string" && profileUser.banner_image) ||
          (typeof profileUser.cover_image === "string" && profileUser.cover_image) ||
          ""
        }
        onProfileUpdated={refreshProfile}
      />
    </div>
  )
}
