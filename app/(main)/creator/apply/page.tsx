"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles, Video, TrendingUp, User, Zap } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { setPendingVideoFile } from "@/lib/upload-pending-video"
import Link from "next/link"

export default function BecomeCreatorPage() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const pickVideoInputRef = useRef<HTMLInputElement>(null)

  const openStudioVideoPicker = () => pickVideoInputRef.current?.click()

  const handleStudioVideoChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    e.target.value = ""
    if (!chosen) return
    if (!chosen.type.startsWith("video/")) {
      toast({
        title: "Not a video file",
        description: "Choose a file with a video format (MP4, MOV, etc.).",
        variant: "destructive",
      })
      return
    }
    setPendingVideoFile(chosen)
    router.push("/upload")
  }

  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push("/login")
        return
      }
      
      if (userData) {
        const creatorStatus = userData.role === "creator" || userData.is_creator === true
        setIsCreator(creatorStatus)
        setIsChecking(false)
      } else if (user && !userData) {
        // User is logged in but userData is not loaded yet, refresh it
        await refreshUserData(true)
      }
    }

    checkCreatorStatus()
  }, [userData, authLoading, user, router, refreshUserData])

  const handleBecomeCreator = async () => {
    if (!userData?.username) {
      toast({
        title: "Error",
        description: "Unable to find your username. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUnlocking(true)
      
      // Update user role to creator via PUT /users/self
      console.log("[creator] Updating user role to 'creator'")
      const updateResponse = await apiClient.updateSelfUser({ role: "creator" })
      console.log("[creator] Update API response:", updateResponse)
      
      // Check if the response contains the updated user data
      const updatedUser = updateResponse?.user
      const responseRole = updatedUser?.role
      
      // Refresh user data to get the updated role from backend
      await refreshUserData(true)
      
      // Verify the role was actually updated
      const verifyResponse = await apiClient.getUserByUsername(userData.username)
      const verifiedRole = verifyResponse?.success ? verifyResponse?.user?.role : null
      
      if (verifiedRole === "creator" || responseRole === "creator") {
        toast({
          title: "You’re a creator",
          description: "Welcome to Hiffi Studio — upload or manage your profile when you’re ready.",
        })

        setIsCreator(true)
        setIsUnlocking(false)
      } else {
        console.error("[creator] Role verification failed. Expected 'creator', got:", verifiedRole)
        
        toast({
          title: "Role Update Issue",
          description: `The role update was sent but the backend returned role as '${verifiedRole || "user"}'. Please try again or contact support.`,
          variant: "destructive",
        })
        setIsUnlocking(false)
      }
      
    } catch (error: any) {
      console.error("[creator] Failed to become creator:", error)
      toast({
        title: "Failed to unlock creator status",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsUnlocking(false)
    }
  }

  // Show loading state while checking auth
  if (authLoading || isChecking) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  // Hiffi Studio: theme-aware surfaces; mobile = stacked, lg+ = wide grid + compact status bar
  if (isCreator) {
    const profileHref = userData?.username ? `/profile/${userData.username}` : "/"

    return (
      <div
        className={cn(
          "min-h-[calc(100vh-4rem)] w-full antialiased selection:bg-primary/20",
          "bg-zinc-100 text-foreground",
          "dark:bg-zinc-900",
        )}
      >
        <main
          className={cn(
            "mx-auto w-full pb-14 pt-6",
            "max-w-lg px-4",
            "sm:max-w-xl sm:px-5 sm:pt-8 sm:pb-16",
            "lg:max-w-5xl lg:px-10 lg:pt-10",
          )}
        >
          <header className="mb-6 text-left sm:mb-8 lg:mb-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Creator
            </p>
            <h1 className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              Hiffi Studio
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
              Your space to publish, refine, and manage your presence on Hiffi.
            </p>
          </header>

          {/* Status: padded card + left bar on mobile; desktop = strip with vertical accent */}
          <section
            className={cn(
              "mb-5 flex overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm",
              "transition-[border-color,box-shadow] duration-200 hover:border-border hover:shadow-md",
              "sm:mb-6 sm:rounded-2xl",
              "lg:mb-8",
            )}
            aria-labelledby="studio-status-label"
          >
            <div
              className="hidden w-1 shrink-0 bg-primary/85 lg:block"
              aria-hidden
            />
            <div className="relative min-w-0 flex-1 px-4 py-4 pl-5 sm:px-6 sm:py-5 sm:pl-6 lg:py-4 lg:pl-6">
              <div
                className="absolute bottom-3 left-0 top-3 w-0.5 rounded-full bg-primary lg:hidden"
                aria-hidden
              />
              <div className="pl-3 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:pl-0">
                <div className="lg:flex lg:items-baseline lg:gap-3">
                  <p
                    id="studio-status-label"
                    className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Creator status
                  </p>
                  <p className="mt-2 text-2xl font-semibold leading-none tracking-tight text-primary lg:mt-0 lg:text-xl">
                    Active
                  </p>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground lg:mt-0 lg:max-w-md lg:text-right">
                  Your channel is active and ready to publish.
                </p>
              </div>
            </div>
          </section>

          {/* Mobile / tablet: stacked. lg: upload (wide) | profile (sidebar column) */}
          <div
            className={cn(
              "flex flex-col gap-4",
              "sm:gap-5",
              "lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-6",
            )}
          >
            <section
              aria-labelledby="upload-action-title"
              className={cn(
                "group rounded-xl border border-primary/25 bg-card p-5 shadow-sm",
                "transition-[border-color,box-shadow,transform] duration-200",
                "hover:border-primary/40 hover:shadow-md",
                "motion-safe:hover:-translate-y-px",
                "sm:rounded-2xl sm:p-7",
                "lg:col-span-7 lg:flex lg:flex-col lg:p-8",
                "xl:col-span-8",
              )}
            >
              <div className="flex flex-1 flex-col gap-5 sm:gap-6 lg:flex-1">
                <div className="flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/[0.14] sm:h-12 sm:w-12"
                    aria-hidden
                  >
                    <Video className="size-5 sm:size-[22px]" strokeWidth={1.65} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2
                      id="upload-action-title"
                      className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                    >
                      Upload a video
                    </h2>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                      Share a new release with your audience.
                    </p>
                  </div>
                </div>
                <input
                  ref={pickVideoInputRef}
                  type="file"
                  accept="video/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={handleStudioVideoChosen}
                />
                <Button
                  type="button"
                  size="lg"
                  data-analytics-name="creator-studio-upload-new-video-button"
                  className="h-11 w-full rounded-xl text-sm font-semibold shadow-none motion-safe:active:scale-[0.99] lg:mt-auto lg:h-12"
                  onClick={openStudioVideoPicker}
                  aria-label="Choose a video file to upload"
                >
                  <Video className="size-4 opacity-95" aria-hidden />
                  Upload new video
                </Button>
              </div>
            </section>

            <section
              aria-labelledby="profile-action-title"
              className={cn(
                "rounded-xl border border-border/80 bg-muted/30 p-5 shadow-sm",
                "transition-[border-color,background-color,box-shadow] duration-200",
                "hover:border-border hover:bg-muted/40 hover:shadow-sm",
                "dark:bg-card/60 dark:hover:bg-card/80",
                "sm:rounded-2xl sm:p-6",
                "lg:col-span-5 lg:flex lg:flex-col lg:justify-between lg:p-6",
                "xl:col-span-4",
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-muted-foreground dark:bg-background/50"
                  aria-hidden
                >
                  <User className="size-[18px]" strokeWidth={1.65} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h2
                    id="profile-action-title"
                    className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]"
                  >
                    Creator profile
                  </h2>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
                    Update how viewers see you across Hiffi.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                size="default"
                data-analytics-name="creator-studio-manage-profile-button"
                className="mt-6 h-10 w-full rounded-xl border-border bg-background/90 text-[13px] font-medium motion-safe:active:scale-[0.99] hover:bg-muted/50 dark:bg-transparent dark:hover:bg-muted/30 lg:mt-6"
              >
                <Link href={profileHref}>Manage profile</Link>
              </Button>
            </section>
          </div>
        </main>
      </div>
    )
  }

  // Become a creator — same shell + typography + card language as Hiffi Studio
  const featureTile = cn(
    "rounded-xl border border-border/80 bg-muted/30 p-5 shadow-sm",
    "transition-[border-color,background-color,box-shadow,transform] duration-200",
    "hover:border-border hover:bg-muted/40 hover:shadow-md",
    "motion-safe:hover:-translate-y-px",
    "dark:bg-card/60 dark:hover:bg-card/80",
    "sm:rounded-2xl sm:p-6",
    "lg:col-span-4",
  )

  const featureIconShell =
    "mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary sm:h-11 sm:w-11"

  return (
    <div
      className={cn(
        "min-h-[calc(100vh-4rem)] w-full antialiased selection:bg-primary/20",
        "bg-zinc-100 text-foreground",
        "dark:bg-zinc-900",
      )}
    >
      <main
        className={cn(
          "mx-auto w-full pb-14 pt-6",
          "max-w-lg px-4",
          "sm:max-w-xl sm:px-5 sm:pt-8 sm:pb-16",
          "lg:max-w-5xl lg:px-10 lg:pt-10",
        )}
      >
        <header className="mb-6 text-left sm:mb-8 lg:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Creator
          </p>
          <h1
            id="become-creator-heading"
            className="mt-1.5 text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl"
          >
            Become a creator
          </h1>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
            Unlock uploads and Hiffi Studio when you’re ready to publish.
          </p>
        </header>

        <section
          className={cn(
            "group mb-5 rounded-xl border border-primary/25 bg-card p-5 shadow-sm",
            "transition-[border-color,box-shadow,transform] duration-200",
            "hover:border-primary/40 hover:shadow-md",
            "motion-safe:hover:-translate-y-px",
            "sm:mb-6 sm:rounded-2xl sm:p-7",
            "lg:mb-8 lg:p-8",
          )}
          aria-labelledby="become-creator-cta-title"
        >
          <div className="flex flex-col gap-5 sm:gap-6">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary",
                  "transition-colors duration-200 group-hover:bg-primary/[0.14] sm:h-12 sm:w-12",
                )}
                aria-hidden
              >
                <Sparkles className="size-5 sm:size-[22px]" strokeWidth={1.65} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h2
                  id="become-creator-cta-title"
                  className="text-[15px] font-semibold tracking-tight text-foreground sm:text-base"
                >
                  Ready to start creating?
                </h2>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Confirm below to enable creator status and open uploads.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              data-analytics-name="creator-become-creator-button"
              className="h-11 w-full rounded-xl text-sm font-semibold shadow-none motion-safe:active:scale-[0.99] lg:h-12"
              onClick={handleBecomeCreator}
              disabled={isUnlocking}
            >
              {isUnlocking ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Unlocking...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden />
                  Become a Creator
                </>
              )}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
              By becoming a creator, you agree to our community guidelines and{" "}
              <Link
                href="/terms-of-use"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                terms of service
              </Link>
              .
            </p>
          </div>
        </section>

        <div
          className={cn(
            "grid gap-4",
            "sm:gap-5",
            "lg:grid-cols-12 lg:gap-6",
          )}
        >
          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <Video className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Upload videos
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Share your content, tutorials, music, and more with the Hiffi community.
            </p>
          </article>

          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <TrendingUp className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Grow your audience
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Build followers, get views, and engage through comments and interactions.
            </p>
          </article>

          <article className={featureTile}>
            <div className={featureIconShell} aria-hidden>
              <Zap className="size-5 sm:size-[22px]" strokeWidth={1.65} />
            </div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-[15px]">
              Creator features
            </h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
              Access tools that help you publish and refine your presence on Hiffi.
            </p>
          </article>
        </div>
      </main>
    </div>
  )
}
