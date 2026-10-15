"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Loader2, Lightbulb } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"
import { FEATURE_REQUEST_PATH } from "@/lib/creator-onboarding-links"
import { Button } from "@/components/ui/button"

type FeatureRequestGateProps = {
  children: ReactNode
}

export function FeatureRequestGate({ children }: FeatureRequestGateProps) {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (!user) {
    const loginUrl = buildLoginUrl(FEATURE_REQUEST_PATH)
    const signupUrl = buildSignupUrl(FEATURE_REQUEST_PATH)

    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Lightbulb className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Sign in to share your idea
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Feature requests are tied to your Hiffi account so we can follow up if we build what you
          asked for. Sign in or create an account to continue — you&apos;ll land right back here.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Button asChild className="min-w-[140px]">
            <Link href={loginUrl} data-analytics-name="feature-request-login">
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" className="min-w-[140px]">
            <Link href={signupUrl} data-analytics-name="feature-request-signup">
              Create account
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return children
}
