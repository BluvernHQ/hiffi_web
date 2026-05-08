import Link from "next/link"
import { format } from "date-fns"
import { Edit, Share2, Copy, Check, Mail } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { VideoGrid } from "@/components/video/video-grid"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import { ProfilePictureDialog } from "@/components/profile/profile-picture-dialog"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { getAvatarLetter, getColorFromName, getProfilePictureProxyUrl, getProfilePictureUrl } from "@/lib/utils"

export function ProfilePersonalView(props: {
  profileUser: any
  username: string
  currentUserData: any
  isOwnProfile: boolean
  profilePictureVersion: number
  referralUrl: string
  copied: boolean
  userVideos: any[]
  isLoading: boolean
  loadingMore: boolean
  hasMore: boolean
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  isProfilePictureDialogOpen: boolean
  setIsProfilePictureDialogOpen: (open: boolean) => void
  authDialogOpen: boolean
  setAuthDialogOpen: (open: boolean) => void
  handleShare: () => void
  handleCopy: () => void
  loadMoreVideos: () => void
  onVideoDeleted: (videoId: string) => void
  onEditProfileUpdated: () => Promise<void>
  onProfilePictureUpdated: () => Promise<void>
}) {
  const {
    profileUser,
    username,
    currentUserData,
    isOwnProfile,
    profilePictureVersion,
    referralUrl,
    copied,
    userVideos,
    isLoading,
    loadingMore,
    hasMore,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isProfilePictureDialogOpen,
    setIsProfilePictureDialogOpen,
    authDialogOpen,
    setAuthDialogOpen,
    handleShare,
    handleCopy,
    loadMoreVideos,
    onVideoDeleted,
    onEditProfileUpdated,
    onProfilePictureUpdated,
  } = props

  return (
    <>
      <div className="bg-background w-full">
        {/* Cover Image / Banner */}
        <div className="h-32 sm:h-40 md:h-48 lg:h-64 w-full relative overflow-hidden">
          {profileUser.coverUrl ? (
            <img src={profileUser.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <img src="/abstract-orange-pattern.png" alt="Profile header" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="w-full px-3 py-4 sm:px-4 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto pb-4 sm:pb-6 md:pb-8">
            {/* Profile Header */}
            <div className="relative -mt-12 sm:-mt-16 md:-mt-20 mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4 md:gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 border-2 sm:border-3 md:border-4 border-background shadow-lg">
                  <AvatarImage
                    src={(() => {
                      const profilePicUrl = getProfilePictureUrl(profileUser, true)
                      const proxyUrl = getProfilePictureProxyUrl(profilePicUrl)
                      if (proxyUrl && profilePictureVersion > 0) {
                        const separator = proxyUrl.includes("?") ? "&" : "?"
                        return `${proxyUrl}${separator}v=${profilePictureVersion}`
                      }
                      return proxyUrl || undefined
                    })()}
                    key={`avatar-main-${profileUser?.profile_picture || "none"}-${profilePictureVersion}-${profileUser?.updated_at || "no-update"}`}
                    alt={`${profileUser?.name || profileUser?.username || username}'s profile picture`}
                  />
                  <AvatarFallback
                    className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white"
                    style={{
                      backgroundColor: getColorFromName(
                        (profileUser.name && profileUser.name.trim()) || profileUser.username || username || "User",
                      ),
                    }}
                  >
                    {getAvatarLetter(profileUser, username || "U")}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 rounded-full shadow-md h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8"
                  onClick={() => setIsProfilePictureDialogOpen(true)}
                  title="Edit profile picture"
                >
                  <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                </Button>
              </div>

              <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-2 w-full">
                {profileUser.name && profileUser.name.trim() ? (
                  <>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">{profileUser.name.trim()}</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                  </>
                ) : (
                  <>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate mb-1">{profileUser.username || username}</h1>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base">@{profileUser.username || username}</p>
                  </>
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto mt-3 sm:mt-0 sm:pb-4">
                <Button className="flex-1 sm:flex-none text-xs sm:text-sm" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Edit Details</span>
                  <span className="xs:hidden">Edit</span>
                </Button>
                <Button variant="outline" size="icon" className="flex-shrink-0" onClick={handleShare} aria-label="Share profile">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Full Name</Label>
                      <p className="text-sm sm:text-base font-medium break-words">
                        {profileUser.name && profileUser.name.trim() ? profileUser.name.trim() : "Not set"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Username</Label>
                      <p className="text-sm sm:text-base font-medium break-all">@{profileUser.username || username}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm sm:text-base font-medium break-all">{profileUser.email || "Not set"}</p>
                    </div>
                    {profileUser.createdat && (
                      <div className="space-y-1">
                        <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Member Since</Label>
                        <p className="text-sm sm:text-base font-medium">{format(new Date(profileUser.createdat), "MMMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">About</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  <div className="space-y-1">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Bio</Label>
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {profileUser.bio && profileUser.bio.trim() ? profileUser.bio.trim() : "No bio available. Click Edit to add one."}
                    </p>
                  </div>

                  {/* Email display below bio */}
                  {(profileUser.email || (isOwnProfile && currentUserData?.email)) && (
                    <div className="pt-3 border-t">
                      <Label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</Label>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <a
                          href={`mailto:${profileUser.email || currentUserData?.email}`}
                          className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors break-all"
                        >
                          {profileUser.email || currentUserData?.email}
                        </a>
                      </div>
                      <div className="mt-3">
                        <Label className="text-xs font-medium text-muted-foreground block mb-1.5">Referral URL</Label>
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="min-w-0 flex-1 truncate whitespace-nowrap text-xs sm:text-sm font-medium text-foreground" title={referralUrl}>
                            {referralUrl}
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={handleCopy}
                            aria-label="Copy referral URL"
                          >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {userVideos.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VideoGrid
                      videos={userVideos}
                      loading={isLoading || loadingMore}
                      hasMore={hasMore}
                      showDeleteOption={isOwnProfile}
                      onLoadMore={loadMoreVideos}
                      onVideoDeleted={onVideoDeleted}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile Dialogs */}
        {isOwnProfile && profileUser && (
          <>
            <EditProfileDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              currentName={profileUser.name || profileUser.username || ""}
              currentUsername={profileUser.username || username}
              currentEmail={profileUser.email || currentUserData?.email || ""}
              currentBio={profileUser.bio || ""}
              onProfileUpdated={onEditProfileUpdated}
            />
            <ProfilePictureDialog
              open={isProfilePictureDialogOpen}
              onOpenChange={setIsProfilePictureDialogOpen}
              currentProfilePicture={profileUser.profile_picture || ""}
              currentName={profileUser.name || profileUser.username || ""}
              currentUsername={profileUser.username || username}
              onProfileUpdated={onProfilePictureUpdated}
            />
          </>
        )}
        <AuthDialog
          open={authDialogOpen}
          onOpenChange={setAuthDialogOpen}
          title="Sign in to follow creators"
          description="Create an account or sign in to follow creators and stay updated with their latest videos."
        />
      </div>
    </>
  )
}

