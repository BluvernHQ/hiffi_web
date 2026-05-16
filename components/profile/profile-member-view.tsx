import { format } from "date-fns"
import { Calendar, Share2, UserCheck, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { getAvatarLetter, getColorFromName, getProfilePictureProxyUrl, getProfilePictureUrl } from "@/lib/utils"

/** Public profile for members (role user) — no creator videos grid or video stats. */
export function ProfileMemberView(props: {
  profileUser: any
  username: string
  isFollowing: boolean
  isFollowingAction: boolean
  followActionType: "follow" | "unfollow" | null
  profilePictureVersion: number
  authDialogOpen: boolean
  setAuthDialogOpen: (open: boolean) => void
  handleShare: () => void
  handleFollow: () => void
}) {
  const {
    profileUser,
    username,
    isFollowing,
    isFollowingAction,
    followActionType,
    profilePictureVersion,
    authDialogOpen,
    setAuthDialogOpen,
    handleShare,
    handleFollow,
  } = props

  const displayName =
    profileUser.name && String(profileUser.name).trim()
      ? String(profileUser.name).trim()
      : profileUser.username || username

  const followers =
    profileUser?.followers ??
    profileUser?.followers_count ??
    profileUser?.followersCount ??
    profileUser?.user?.followers ??
    0

  const following =
    profileUser?.following ??
    profileUser?.following_count ??
    profileUser?.followingCount ??
    profileUser?.user?.following ??
    0

  return (
    <>
      <div className="bg-background w-full">
        <div className="h-32 sm:h-40 md:h-48 lg:h-64 w-full relative overflow-hidden">
          {profileUser.coverUrl ? (
            <img src={profileUser.coverUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <img src="/abstract-orange-pattern.png" alt="" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto pb-4 sm:pb-6 md:pb-8">
            <div className="relative -mt-12 sm:-mt-16 md:-mt-20 mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 md:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 border-2 sm:border-3 md:border-4 border-background shadow-lg">
                <AvatarImage
                  src={(() => {
                    const baseUrl = getProfilePictureUrl(profileUser, true)
                    const proxyUrl = getProfilePictureProxyUrl(baseUrl)
                    if (proxyUrl && profilePictureVersion > 0) {
                      const separator = proxyUrl.includes("?") ? "&" : "?"
                      return `${proxyUrl}${separator}v=${profilePictureVersion}`
                    }
                    return proxyUrl || undefined
                  })()}
                  alt={`${displayName}'s profile picture`}
                />
                <AvatarFallback
                  className="text-xl sm:text-2xl font-bold text-white"
                  style={{
                    backgroundColor: getColorFromName(displayName),
                  }}
                >
                  {getAvatarLetter(profileUser, username || "U")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{displayName}</h1>
                <p className="text-muted-foreground text-sm">@{profileUser.username || username}</p>
                <p className="mt-1 text-xs text-muted-foreground">Member on Hiffi</p>
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 sm:pb-2">
                <Button
                  className="flex-1 sm:flex-none"
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={handleFollow}
                  disabled={isFollowingAction}
                >
                  {isFollowingAction ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4 animate-pulse" />
                      {followActionType === "unfollow" ? "Unfollowing..." : "Following..."}
                    </>
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share profile">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <p className="text-sm leading-relaxed text-muted-foreground break-words">
                  {profileUser.bio?.trim() || "No bio yet."}
                </p>

                {profileUser.createdat && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>Joined {format(new Date(profileUser.createdat), "MMMM yyyy")}</span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3 text-sm">Stats</h3>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-lg font-bold">
                        {(typeof followers === "number" ? followers : 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">Followers</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-lg font-bold">
                        {(typeof following === "number" ? following : 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">Following</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        title="Sign in to follow"
        description="Create an account or sign in to follow members on Hiffi."
      />
    </>
  )
}
