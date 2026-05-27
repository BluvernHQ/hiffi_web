"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { buildSignupUrl } from "@/lib/auth-utils"

export function GuestLikedView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const signupUrl = buildSignupUrl(pathname, searchParamsString)

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" aria-hidden />
        <div className="relative rounded-full bg-muted p-6">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      <h1 className="text-xl font-semibold">Your liked library lives here</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Sign up to save tracks you love and come back to them anytime.
      </p>
      <Button asChild className="mt-6 rounded-full px-6" size="lg">
        <Link href={signupUrl} data-analytics-name="guest-liked-signup">
          Create free account
        </Link>
      </Button>
    </div>
  )
}
