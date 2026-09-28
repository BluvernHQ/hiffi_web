"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Copy, Edit, ExternalLink, Flag, UserCheck, UserPlus } from "lucide-react"
import type { Artist } from "@/lib/artists"
import { artistIndexHref } from "@/lib/artist-directory"
import { ArtistClaimCta } from "@/components/artists/ArtistClaimCta"
import { ArtistDetailAbout } from "@/components/artists/ArtistDetailAbout"
import { ArtistDetailHero } from "@/components/artists/ArtistDetailHero"
import { ArtistSocialLinks } from "@/components/artists/ArtistSocialLinks"
import { AuthDialog, AUTH_DIALOG_COPY } from "@/components/auth/auth-dialog"
import { ProfileEmailReveal } from "@/components/profile/profile-email-reveal"
import { ProfilePictureDialog } from "@/components/profile/profile-picture-dialog"
import { Button } from "@/components/ui/button"
import { VideoGrid } from "@/components/video/video-grid"
import { cn } from "@/lib/utils"

type ProfileTab = "videos" | "about"

type ProfileInventoryViewProps = {
  artist: Artist
  profileUser: any
  username: string
  isOwnProfile: boolean
  /** Owners see it directly; visitors reveal it after sign-in + captcha. */
  email?: string
  /** When false, hide inventory claim banners (non-inventory creators). */
  showClaimCta?: boolean
  isFollowing: boolean
  isFollowingAction: boolean
  followActionType: "follow" | "unfollow" | null
  referralUrl: string
  copied: boolean
  userVideos: any[]
  isLoading: boolean
  loadingMore: boolean
  hasMore: boolean
  isProfilePictureDialogOpen: boolean
  setIsProfilePictureDialogOpen: (open: boolean) => void
  authDialogOpen: boolean
  setAuthDialogOpen: (open: boolean) => void
  handleShare: () => void
  handleCopy: () => void
  handleFollow: () => void
  loadMoreVideos: () => void
  onVideoDeleted: (videoId: string) => void
  onProfilePictureUpdated: () => Promise<void>
  onReport?: () => void
}

const tabTriggerClass = cn(
  "relative h-11 flex-1 rounded-none border-0 bg-transparent px-3 text-sm font-semibold tracking-wide text-muted-foreground sm:h-12 sm:flex-none sm:px-5 sm:text-[13px] sm:uppercase sm:tracking-[0.12em]",
  "hover:text-foreground",
  "aria-selected:text-foreground",
  "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent sm:after:inset-x-4",
  "aria-selected:after:bg-[#E8192C]",
  "focus-visible:outline-none",
)

const heroBtnBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors sm:min-h-0 sm:px-5"

/**
 * Creator profile page using Artist Index detail UI (hero / about / socials).
 * Used for all creators; inventory claim chrome only when `showClaimCta`.
 */
export function ProfileInventoryView(props: ProfileInventoryViewProps) {
  const {
    artist,
    profileUser,
    username,
    isOwnProfile,
    email,
    showClaimCta = false,
    isFollowing,
    isFollowingAction,
    followActionType,
    referralUrl,
    copied,
    userVideos,
    isLoading,
    loadingMore,
    hasMore,
    isProfilePictureDialogOpen,
    setIsProfilePictureDialogOpen,
    authDialogOpen,
    setAuthDialogOpen,
    handleCopy,
    handleFollow,
    loadMoreVideos,
    onVideoDeleted,
    onProfilePictureUpdated,
    onReport,
  } = props

  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ProfileTab>("videos")

  const profilePath = `/profile/${encodeURIComponent(username)}`
  const hiffiVideoCount = Math.max(
    0,
    Number(
      profileUser?.total_videos ??
        profileUser?.totalVideos ??
        profileUser?.totalvideos ??
        profileUser?.user?.total_videos ??
        profileUser?.user?.totalVideos ??
        userVideos.length ??
        0,
    ) || userVideos.length,
  )

  const handleTabChange = (next: ProfileTab) => {
    setActiveTab(next)
    requestAnimationFrame(() => {
      document.getElementById("profile-tabs")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    })
  }

  const heroActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {isOwnProfile ? (
        <>
          <button
            type="button"
            onClick={() =>
              router.push(`/profile/${encodeURIComponent(username)}/edit`)
            }
            className={cn(heroBtnBase, "w-full bg-[#E8192C] text-white hover:bg-[#d01528] sm:w-auto")}
          >
            <Edit className="h-4 w-4 shrink-0" aria-hidden />
            Edit profile
          </button>
          {showClaimCta ? (
            <Link
              href={artistIndexHref(artist.slug || username)}
              className={cn(
                heroBtnBase,
                "w-full border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto",
              )}
              data-analytics-name="profile-artist-index-link"
            >
              <span className="sm:hidden">Index</span>
              <span className="hidden sm:inline">View on Artist Index</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={handleFollow}
            disabled={isFollowingAction}
            className={cn(
              heroBtnBase,
              "w-full text-white sm:w-auto",
              isFollowing
                ? "border border-white/25 bg-white/10 backdrop-blur-sm hover:bg-white/20"
                : "bg-[#E8192C] hover:bg-[#d01528]",
            )}
          >
            {isFollowingAction ? (
              <>
                <UserPlus className="h-4 w-4 shrink-0 animate-pulse" aria-hidden />
                {followActionType === "unfollow" ? "Unfollowing..." : "Following..."}
              </>
            ) : isFollowing ? (
              <>
                <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
                Following
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                Follow
              </>
            )}
          </button>
          <div className="flex gap-2 sm:contents">
            {showClaimCta ? (
              <Link
                href={artistIndexHref(artist.slug || username)}
                className={cn(
                  heroBtnBase,
                  "min-w-0 flex-1 border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 sm:flex-none",
                )}
                data-analytics-name="profile-artist-index-link"
              >
                <span className="truncate sm:hidden">Index</span>
                <span className="hidden sm:inline">View on Artist Index</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              </Link>
            ) : null}
            {onReport ? (
              <button
                type="button"
                onClick={onReport}
                className={cn(
                  heroBtnBase,
                  "shrink-0 border border-white/25 bg-white/10 px-3 text-white backdrop-blur-sm hover:bg-white/20 sm:px-2.5",
                )}
                aria-label="Report profile"
                data-analytics-name="report-profile"
              >
                <Flag className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        </>
      )}

      {isOwnProfile && onReport ? (
        <button
          type="button"
          onClick={onReport}
          className={cn(
            heroBtnBase,
            "hidden border border-white/25 bg-white/10 px-2.5 text-white backdrop-blur-sm hover:bg-white/20 sm:inline-flex",
          )}
          aria-label="Report profile"
          data-analytics-name="report-profile"
        >
          <Flag className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      <div className="bg-background w-full">
        <div className="w-full space-y-4 px-3 pb-6 pt-3 sm:space-y-6 sm:px-4 sm:pb-8 sm:pt-4 md:px-6 lg:px-8">
          <ArtistDetailHero
            artist={artist}
            profilePath={profilePath}
            username={profileUser?.username || username}
            hiffiVideoCount={hiffiVideoCount}
            actions={heroActions}
            hideStatusBadge
            className="mx-0 max-w-none w-full"
            compact
          />

          <div className="w-full">
            <div id="profile-tabs" className="border-b border-border" role="tablist" aria-label="Profile sections">
              <div className="flex w-full">
                <button
                  type="button"
                  role="tab"
                  id="profile-tab-videos"
                  aria-selected={activeTab === "videos"}
                  aria-controls="profile-panel-videos"
                  tabIndex={activeTab === "videos" ? 0 : -1}
                  onClick={() => handleTabChange("videos")}
                  className={tabTriggerClass}
                >
                  Videos
                  {hiffiVideoCount > 0 ? (
                    <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium normal-case tracking-normal text-muted-foreground tabular-nums">
                      {hiffiVideoCount}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  role="tab"
                  id="profile-tab-about"
                  aria-selected={activeTab === "about"}
                  aria-controls="profile-panel-about"
                  tabIndex={activeTab === "about" ? 0 : -1}
                  onClick={() => handleTabChange("about")}
                  className={tabTriggerClass}
                >
                  About
                </button>
              </div>
            </div>

            {activeTab === "videos" ? (
              <div
                id="profile-panel-videos"
                role="tabpanel"
                aria-labelledby="profile-tab-videos"
                className="mt-3 focus-visible:outline-none sm:mt-6"
              >
              {userVideos.length > 0 ? (
                <VideoGrid
                  videos={userVideos}
                  loading={isLoading || loadingMore}
                  hasMore={hasMore}
                  alwaysShowMoreMenu
                  dense
                  showDeleteOption={isOwnProfile}
                  onLoadMore={loadMoreVideos}
                  onVideoDeleted={onVideoDeleted}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-14 text-center sm:px-8">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading videos...</span>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-sm space-y-2">
                      <p className="text-base font-semibold text-foreground">No videos yet</p>
                      <p className="text-sm text-muted-foreground">
                        {isOwnProfile
                          ? "Upload your first music video to show it here."
                          : "Check back soon — this artist hasn’t posted on Hiffi yet."}
                      </p>
                    </div>
                  )}
                </div>
              )}
              </div>
            ) : (
              <div
                id="profile-panel-about"
                role="tabpanel"
                aria-labelledby="profile-tab-about"
                className="mt-4 focus-visible:outline-none sm:mt-6"
              >
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.85fr)] lg:gap-8">
                <ArtistDetailAbout
                  artist={artist}
                  hiffiVideoCount={hiffiVideoCount}
                  showWatchPrompt={false}
                />
                <div className="flex flex-col gap-4 sm:gap-6">
                  {email ? (
                    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                        {isOwnProfile ? "Account" : "Contact"}
                      </h2>
                      <ProfileEmailReveal
                        username={username}
                        email={email}
                        isOwnProfile={isOwnProfile}
                        onRequestSignIn={() => setAuthDialogOpen(true)}
                        className="mt-3 sm:mt-4"
                      />
                    </section>
                  ) : null}
                  {isOwnProfile ? (
                    <section className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6">
                      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
                        Referral
                      </h2>
                      <div className="mt-3 border-t border-border sm:mt-4" aria-hidden />
                      <div className="mt-3 flex items-start gap-2 sm:mt-4 sm:items-center">
                        <p
                          className="min-w-0 flex-1 break-all text-xs font-medium leading-relaxed text-foreground sm:truncate sm:break-normal sm:text-sm sm:leading-normal"
                          title={referralUrl}
                        >
                          {referralUrl}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={handleCopy}
                          aria-label="Copy referral URL"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </section>
                  ) : (
                    <p className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      <Link
                        href={`/collaborate?artist=${encodeURIComponent(username)}`}
                        className="font-medium text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                      >
                        Is your brand aligned with this artist?
                      </Link>
                    </p>
                  )}

                  <ArtistSocialLinks artist={artist} />
                </div>
              </div>
              </div>
            )}
          </div>

          {showClaimCta ? (
            <div className="pt-2">
              <ArtistClaimCta artist={artist} variant="banner" />
            </div>
          ) : null}
        </div>
      </div>

      {isOwnProfile && profileUser ? (
        <ProfilePictureDialog
          open={isProfilePictureDialogOpen}
          onOpenChange={setIsProfilePictureDialogOpen}
          currentProfilePicture={profileUser.profile_picture || ""}
          currentName={profileUser.name || profileUser.username || ""}
          currentUsername={profileUser.username || username}
          onProfileUpdated={onProfilePictureUpdated}
        />
      ) : null}

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title={AUTH_DIALOG_COPY.follow.title}
        description={AUTH_DIALOG_COPY.follow.description}
        signupLabel={AUTH_DIALOG_COPY.follow.signupLabel}
        signinLabel={AUTH_DIALOG_COPY.follow.signinLabel}
        conversionTrigger="follow_attempt"
        artistUsername={username}
        artistDisplayName={profileUser?.name || profileUser?.username}
        artistUser={profileUser}
      />
    </>
  )
}
