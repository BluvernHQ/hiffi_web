"use client"

import { Video, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface EmptyVideoStateProps {
  title?: string
  description?: string
  showUploadButton?: boolean
}

export function EmptyVideoState({ 
  title = "No videos yet",
  description,
  showUploadButton = true 
}: EmptyVideoStateProps) {
  const { user } = useAuth()
  const defaultDescription = user 
    ? "Be the first to share a video and start the community!"
    : "Sign in to share your first video and start the community!"

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative bg-muted rounded-full p-6">
          <Video className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2 text-center">{title}</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {description || defaultDescription}
      </p>
      
      {showUploadButton && user && (
        <Button asChild size="lg" className="mt-2">
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Your First Video
          </Link>
        </Button>
      )}
      
      {showUploadButton && !user && (
        <Button asChild size="lg" variant="outline" className="mt-2">
          <Link href="/login">
            Sign In to Upload
          </Link>
        </Button>
      )}
    </div>
  )
}

