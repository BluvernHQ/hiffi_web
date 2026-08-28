"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import {
  rememberArtistDirectoryReturnUrl,
  setArtistDirectoryNavSelection,
  slugFromArtistProfileHref,
} from "@/lib/artist-index/directory-nav-context"

type ArtistProfileLinkProps = ComponentProps<typeof Link>

export function ArtistProfileLink({ onClick, href, ...props }: ArtistProfileLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        rememberArtistDirectoryReturnUrl()
        const slug = typeof href === "string" ? slugFromArtistProfileHref(href) : null
        if (slug) setArtistDirectoryNavSelection(slug)
        onClick?.(event)
      }}
    />
  )
}
