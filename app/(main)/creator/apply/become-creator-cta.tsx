"use client"

import { useState, useEffect, type FormEvent } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
const RESEND_COOLDOWN_SECONDS = 60

export function BecomeCreatorCta() {
  const { user, userData, loading: authLoading, refreshUserData } = useAuth()
  const { toast } = useToast()
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [upgradeStep, setUpgradeStep] = useState<"idle" | "otp">("idle")
  const [otpId, setOtpId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null)
  const [resendCountdown, setResendCountdown] = useState(0)

  const accountEmail =
    userData?.email || userData?.user_email || userData?.userEmail || ""

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

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  const finishCreatorUpgrade = async () => {
    const refreshed = await refreshUserData(true)
    const verifiedRole = refreshed?.role

    if (verifiedRole !== "creator" && userData?.username) {
      const verifyResponse = await apiClient.getUserByUsername(userData.username)
      const roleFromApi = verifyResponse?.success ? verifyResponse?.user?.role : null
      if (roleFromApi !== "creator") {
        throw new Error("Creator upgrade did not complete. Please try again.")
      }
    } else if (verifiedRole !== "creator") {
      throw new Error("Creator upgrade did not complete. Please try again.")
    }

    trackUmami("Creator Account Created", {
      username: userData?.username ?? null,
    })
    toast({
      title: "You're a creator",
      description: "Welcome to Hiffi Studio — upload or manage your profile when you're ready.",
    })
    setIsCreator(true)
    setUpgradeStep("idle")
    setOtpId(null)
    setOtp("")
    setUpgradeMessage(null)
    setResendCountdown(0)
  }

  const handleRequestUpgrade = async () => {
    if (!userData?.username) {
      toast({
        title: "Error",
        description: "Unable to find your username. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!accountEmail.trim()) {
      toast({
        title: "Email required",
        description: "Add an email to your profile before upgrading to creator.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsRequesting(true)

      const response = await apiClient.requestCreatorUpgrade()

      if (!response.success || !response.data?.id) {
        const message = response.error || "Failed to send verification code. Please try again."
        const lower = message.toLowerCase()
        if (lower.includes("email")) {
          toast({
            title: "Email required",
            description: `Add an email on your profile (/profile/${userData.username}) before becoming a creator.`,
            variant: "destructive",
          })
        } else if (lower.includes("already") && lower.includes("creator")) {
          await refreshUserData(true)
          setIsCreator(true)
          toast({
            title: "Already a creator",
            description: "Your account already has creator access.",
          })
        } else {
          toast({
            title: "Could not start upgrade",
            description: message,
            variant: "destructive",
          })
        }
        return
      }

      setOtpId(response.data.id)
      setUpgradeMessage(
        response.data.message ||
          "OTP sent to your registered email. Please verify to complete the creator upgrade.",
      )
      setUpgradeStep("otp")
      setOtp("")
      setResendCountdown(RESEND_COOLDOWN_SECONDS)
      if (upgradeStep === "otp") {
        toast({
          title: "Code resent",
          description: "Check your email for a new verification code.",
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again."
      toast({
        title: "Failed to start creator upgrade",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleVerifyUpgrade = async (e: FormEvent) => {
    e.preventDefault()

    if (!otpId) {
      toast({
        title: "Error",
        description: "Verification session expired. Please request a new code.",
        variant: "destructive",
      })
      return
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsVerifying(true)

      const response = await apiClient.verifyCreatorUpgrade({ id: otpId, otp })

      if (!response.success) {
        throw new Error(response.error || "OTP verification failed. Please try again.")
      }

      const upgradedRole = response.user?.role || response.data?.user?.role
      if (upgradedRole && upgradedRole !== "creator") {
        throw new Error("Creator upgrade did not complete. Please try again.")
      }

      await finishCreatorUpgrade()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "OTP verification failed. Please try again."
      toast({
        title: "Verification failed",
        description: message,
        variant: "destructive",
      })
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBackToRequest = () => {
    setUpgradeStep("idle")
    setOtpId(null)
    setOtp("")
    setUpgradeMessage(null)
    setResendCountdown(0)
  }

  const showAuthSpinner = authLoading || (user && isChecking)
  const isLoggedOut = !authLoading && !isChecking && !user
  const isBusy = isRequesting || isVerifying

  if (isCreator && !showAuthSpinner) {
    return (
      <div className="flex flex-col gap-5 sm:gap-6">
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
          You already have creator access. Head to{" "}
          <Link href="/studio" className="font-medium text-primary hover:underline">
            Hiffi Studio
          </Link>{" "}
          to upload.
        </div>
        <BecomeCreatorTermsNote />
      </div>
    )
  }

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
            {isLoggedOut
              ? "Start your creator journey"
              : upgradeStep === "otp"
                ? "Verify your email"
                : "Ready to start creating?"}
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            {isLoggedOut
              ? "Create a free account or sign in to unlock creator tools, upload music videos, and publish your first release on Hiffi."
              : upgradeStep === "otp"
                ? upgradeMessage ||
                  `We've sent a 6-digit code to ${accountEmail}. Enter it below to complete your creator upgrade.`
                : accountEmail.trim()
                  ? "We'll email a verification code to your registered address to confirm creator access."
                  : "Add an email to your profile, then verify it to enable creator uploads."}
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
      ) : upgradeStep === "otp" ? (
        <form onSubmit={handleVerifyUpgrade} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creator-upgrade-otp">OTP Code</Label>
            <Input
              id="creator-upgrade-otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                setOtp(value)
              }}
              autoComplete="off"
              required
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              disabled={isVerifying}
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code sent to {accountEmail || "your email"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={handleBackToRequest}
              disabled={isBusy}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="sm:flex-1"
              data-analytics-name="creator-verify-upgrade-otp-button"
              disabled={isVerifying || otp.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Verifying...
                </>
              ) : (
                "Verify & become a creator"
              )}
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive the code?{" "}
            {resendCountdown > 0 ? (
              <span>Resend in {resendCountdown}s</span>
            ) : (
              <button
                type="button"
                className="font-medium text-primary hover:underline disabled:opacity-50"
                onClick={() => void handleRequestUpgrade()}
                disabled={isBusy}
              >
                {isRequesting ? "Sending..." : "Resend code"}
              </button>
            )}
          </div>
        </form>
      ) : (
        <>
          {!accountEmail.trim() && userData?.username ? (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/profile/${encodeURIComponent(userData.username)}`}
                className="font-medium text-primary hover:underline"
              >
                Add an email on your profile
              </Link>{" "}
              before upgrading to creator.
            </p>
          ) : null}
          <Button
            type="button"
            data-analytics-name="creator-become-creator-button"
            className="h-9 w-full rounded-full text-[13px] font-semibold shadow-none motion-safe:active:scale-[0.99] sm:h-10 sm:rounded-xl sm:text-sm lg:h-11"
            onClick={() => void handleRequestUpgrade()}
            disabled={isBusy || !accountEmail.trim()}
          >
            {isRequesting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Sending code...
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden />
                Become a Creator
              </>
            )}
          </Button>
        </>
      )}

      <BecomeCreatorTermsNote />
    </div>
  )
}
