"use client"

import { usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"
import { captureConversionEvent } from "@/lib/conversion-tracking"
import { cn } from "@/lib/utils"

/** Shared copy for gated actions (follow, playlists, likes, etc.). */
export const AUTH_DIALOG_COPY = {
  follow: {
    title: "Never miss a drop",
    description: "Sign up to follow artists and get notified when they upload something new.",
    signupLabel: "Sign up free",
    signinLabel: "Log in",
  },
  playlist: {
    title: "Sign in to save to playlists",
    description: "Create an account or sign in to add videos to your playlists and manage them anytime.",
    signupLabel: "Sign up free",
    signinLabel: "Log in",
  },
  like: {
    title: "Save what you love",
    description:
      "Sign up to like tracks, build your taste profile, and get picks that actually match your vibe.",
    subdescription: "Your like is saved once you sign up.",
    signupLabel: "Sign up free",
    signinLabel: "Log in",
  },
  report: {
    title: "Sign in to report",
    description: "Create an account or sign in to report content or profiles for review.",
    signupLabel: "Sign up free",
    signinLabel: "Log in",
  },
} as const

export type AuthDialogCopyKey = keyof typeof AUTH_DIALOG_COPY

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  subdescription?: string
  signupLabel?: string
  signinLabel?: string
  /** Follow gate: show artist in modal */
  artistUsername?: string
  artistDisplayName?: string
  artistUser?: Record<string, unknown> | null
  conversionTrigger?: "like_attempt" | "follow_attempt" | "playlist"
}

export function AuthDialog({
  open,
  onOpenChange,
  title,
  description,
  subdescription,
  signupLabel,
  signinLabel,
  artistUsername,
  artistDisplayName,
  artistUser,
  conversionTrigger,
}: AuthDialogProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined

  const loginUrl = buildLoginUrl(pathname, searchParamsString)
  const signupUrl = buildSignupUrl(pathname, searchParamsString)

  const followTitle =
    artistUsername || artistDisplayName
      ? `Never miss a drop from ${artistDisplayName?.trim() || `@${artistUsername}`}`
      : title

  const resolvedTitle = followTitle || title || "Sign in required"
  const resolvedDescription =
    description || "Please sign in or create an account to continue."
  const resolvedSubdescription =
    conversionTrigger === "like_attempt"
      ? subdescription || AUTH_DIALOG_COPY.like.subdescription
      : subdescription
  const resolvedSignupLabel = signupLabel || "Sign up free"
  const resolvedSigninLabel = signinLabel || "Log in"

  const handleOpenChange = (next: boolean) => {
    if (next && conversionTrigger) {
      captureConversionEvent("conversion_auth_prompt_shown", {
        trigger: conversionTrigger,
        artist_username: artistUsername,
        source_path: pathname,
      })
    }
    if (!next && open && conversionTrigger) {
      captureConversionEvent("conversion_auth_prompt_dismissed", {
        trigger: conversionTrigger,
        source_path: pathname,
      })
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        overlayClassName="z-[100] bg-black/30 backdrop-blur-[2px]"
        className="z-[100] sm:max-w-md"
      >
        <DialogHeader>
          {artistUsername && conversionTrigger === "follow_attempt" ? (
            <div className="mb-2 flex items-center gap-3">
              <ProfilePicture user={artistUser} size="lg" />
              <div className="min-w-0 text-left">
                <p className="text-xs font-medium text-muted-foreground">@{artistUsername}</p>
              </div>
            </div>
          ) : null}
          <DialogTitle>{resolvedTitle}</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="leading-relaxed">{resolvedDescription}</p>
              {resolvedSubdescription ? (
                <p className="leading-relaxed text-foreground/80">{resolvedSubdescription}</p>
              ) : null}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={cn("flex-col gap-2 sm:flex-row")}>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={loginUrl} onClick={() => onOpenChange(false)}>
              {resolvedSigninLabel}
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={signupUrl} onClick={() => onOpenChange(false)}>
              {resolvedSignupLabel}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
