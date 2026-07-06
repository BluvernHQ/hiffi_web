"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { isCreator } from "@/lib/auth/roles"
import { STUDIO_HOME } from "@/lib/studio-routes"

const CREATOR_APPLY_PATH = "/creator/apply"

type CreatorDestinationLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string
}

/**
 * Routes guests and non-creators to /creator/apply; active creators go straight to Studio.
 */
export function CreatorDestinationLink({
  href = CREATOR_APPLY_PATH,
  children,
  ...props
}: CreatorDestinationLinkProps) {
  const { user, userData, loading } = useAuth()

  const destination =
    !loading && user && userData && isCreator(userData) ? STUDIO_HOME : href

  return (
    <Link href={destination} {...props}>
      {children}
    </Link>
  )
}
