"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"

/** Shared copy for gated actions (follow, playlists, likes, etc.). */
export const AUTH_DIALOG_COPY = {
  follow: {
    title: "Sign in to follow creators",
    description:
      "Create an account or sign in to follow creators and stay updated with their latest videos.",
  },
  playlist: {
    title: "Sign in to save to playlists",
    description:
      "Create an account or sign in to add videos to your playlists and manage them anytime.",
  },
  like: {
    title: "Sign in to save to Liked",
    description:
      "Create an account or sign in to save videos to your Liked library and find them anytime.",
  },
} as const

export type AuthDialogCopyKey = keyof typeof AUTH_DIALOG_COPY

interface AuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
}

export function AuthDialog({ open, onOpenChange, title, description }: AuthDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined

  const loginUrl = buildLoginUrl(pathname, searchParamsString)
  const signupUrl = buildSignupUrl(pathname, searchParamsString)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title || "Sign in required"}</DialogTitle>
          <DialogDescription>
            {description || "Please sign in or create an account to continue."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href={signupUrl} onClick={() => onOpenChange(false)}>
              Sign up
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={loginUrl} onClick={() => onOpenChange(false)}>
              Sign in
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

