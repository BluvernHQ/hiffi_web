"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { BecomeCreatorTermsNote } from "@/components/creator/become-creator-terms"
import { trackUmami } from "@/lib/umami"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"

const CREATOR_APPLY_PATH = "/creator/apply"
const LOGIN_REDIRECT = buildLoginUrl(CREATOR_APPLY_PATH)
const SIGNUP_REDIRECT = buildSignupUrl(CREATOR_APPLY_PATH)

export function BecomeCreatorCta() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkCreatorStatus = async () => {
      if (authLoading) return

      if (!user) {
        setIsChecking(false)
        return
      }

      if (userData) {
        const creatorStatus = userData.role === "creator" || userData.is_creator === true
        setIsCreator(creatorStatus)
        setIsChecking(false)
      } else if (user && !userData) {
        await refreshUserData(true)
      }
    }

    void checkCreatorStatus()
  }, [userData, authLoading, user, refreshUserData])

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

      const updateResponse = await apiClient.updateSelfUser({ role: "creator" })
      const updatedUser = updateResponse?.user
      const responseRole = updatedUser?.role

      await refreshUserData(true)

      const verifyResponse = await apiClient.getUserByUsername(userData.username)
      const verifiedRole = verifyResponse?.success ? verifyResponse?.user?.role : null

      if (verifiedRole === "creator" || responseRole === "creator") {
        trackUmami("Creator Account Created", {
          username: userData?.username ?? null,
        })
        toast({
          title: "You’re a creator",
          description: "Welcome to Hiffi Studio — upload or manage your profile when you’re ready.",
        })
        setIsCreator(true)
        setIsUnlocking(false)
      } else {
        toast({
          title: "Role Update Issue",
          description: `The role update was sent but the backend returned role as '${verifiedRole || "user"}'. Please try again or contact support.`,
          variant: "destructive",
        })
        setIsUnlocking(false)
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
      toast({
        title: "Failed to unlock creator status",
        description: message,
        variant: "destructive",
      })
      setIsUnlocking(false)
    }
  }

  const showAuthSpinner = authLoading || (user && isChecking)
  const isLoggedOut = !authLoading && !isChecking && !user

  return (
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
            {isLoggedOut ? "Sign in to get started" : "Ready to start creating?"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {isLoggedOut
              ? "Create an account or sign in, then confirm below to enable creator uploads."
              : "Confirm below to enable creator status and open uploads."}
          </p>
        </div>
      </div>

      {showAuthSpinner ? (
        <div className="flex flex-col items-center gap-3 py-2" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : isLoggedOut ? (
        <div className="flex flex-row gap-2.5 sm:gap-3">
          <Button
            asChild
            className="h-9 min-h-9 flex-1 rounded-full px-3 text-[13px] font-semibold sm:h-10 sm:rounded-xl sm:px-4 sm:text-sm lg:h-11"
          >
            <Link href={LOGIN_REDIRECT} data-analytics-name="creator-apply-sign-in">
              Sign in
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 min-h-9 flex-1 rounded-full px-3 text-[13px] font-semibold sm:h-10 sm:rounded-xl sm:px-4 sm:text-sm lg:h-11"
          >
            <Link href={SIGNUP_REDIRECT} data-analytics-name="creator-apply-sign-up">
              Create account
            </Link>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          data-analytics-name="creator-become-creator-button"
          className="h-9 w-full rounded-full text-[13px] font-semibold shadow-none motion-safe:active:scale-[0.99] sm:h-10 sm:rounded-xl sm:text-sm lg:h-11"
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
      )}

      <BecomeCreatorTermsNote />
    </div>
  )
}
