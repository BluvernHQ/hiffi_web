"use client"

import { Users, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { usePathname, useSearchParams } from "next/navigation"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"

interface FollowingEmptyStateProps {
  hasFollowedUsers: boolean
  onDiscoverClick?: () => void
}

export function FollowingEmptyState({ hasFollowedUsers, onDiscoverClick }: FollowingEmptyStateProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const signupUrl = buildSignupUrl(pathname, searchParamsString)
  const loginUrl = buildLoginUrl(pathname, searchParamsString)

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative bg-muted rounded-full p-6">
          <Users className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      
      {!user ? (
        <>
          <h3 className="text-xl font-semibold mb-2 text-center">
            Build a feed from artists you love
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Sign up to follow creators and get notified when they upload something new.
          </p>
          <div className="flex flex-col items-center gap-2 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href={signupUrl} data-analytics-name="guest-following-signup">
                Create free account
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-6">
              <Link href={loginUrl} data-analytics-name="guest-following-login">
                Log in
              </Link>
            </Button>
          </div>
        </>
      ) : hasFollowedUsers ? (
        <>
          <h3 className="text-xl font-semibold mb-2 text-center">
            No videos from followed creators yet
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Videos from creators you follow will appear here
          </p>
          <Button 
            onClick={onDiscoverClick}
            variant="default"
            size="lg"
            className="mt-4"
          >
            <Search className="mr-2 h-4 w-4" />
            Discover Videos
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-xl font-semibold mb-2 text-center">
            Start following creators
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Follow creators you like to see their videos in your feed
          </p>
          <Button 
            onClick={onDiscoverClick}
            variant="default"
            size="lg"
            className="mt-4"
          >
            <Search className="mr-2 h-4 w-4" />
            Discover Videos
          </Button>
        </>
      )}
    </div>
  )
}

