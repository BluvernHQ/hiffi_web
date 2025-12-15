"use client"

import { Users, Search, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface FollowingEmptyStateProps {
  hasFollowedUsers: boolean
  onDiscoverClick?: () => void
}

export function FollowingEmptyState({ hasFollowedUsers, onDiscoverClick }: FollowingEmptyStateProps) {
  const { user } = useAuth()

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
            Sign in to see videos from creators you follow
          </h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Follow creators to build your personalized video feed
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
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

