"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  canNavigateArtistDirectoryNext,
  canNavigateArtistDirectoryPrev,
  getArtistDirectoryNavContext,
  getArtistDirectoryNavPosition,
  resolveAdjacentArtistDirectorySlug,
  saveArtistDirectoryNavContext,
  syncArtistDirectoryNavSelection,
  type ArtistDirectoryNavContext,
} from "@/lib/artist-index/directory-nav-context"
import { cn } from "@/lib/utils"

type ArtistProfileDirectoryNavProps = {
  slug: string
  variant?: "header" | "footer" | "both"
  /** When set, prev/next swap profile content in place instead of a full route navigation. */
  onDirectoryNavigate?: (slug: string, context: ArtistDirectoryNavContext) => void
}

function NavArrowButton({
  label,
  disabled,
  loading,
  onClick,
}: {
  label: string
  disabled: boolean
  loading?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors",
        "hover:border-[#E8192C]/40 hover:text-[#E8192C] disabled:pointer-events-none disabled:opacity-40",
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : label.toLowerCase().includes("previous") ? (
        <ChevronLeft className="h-4 w-4" aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}

export function ArtistProfileDirectoryNav({
  slug,
  variant = "both",
  onDirectoryNavigate,
}: ArtistProfileDirectoryNavProps) {
  const router = useRouter()
  const [context, setContext] = useState<ArtistDirectoryNavContext | null>(null)
  const [loadingDirection, setLoadingDirection] = useState<"prev" | "next" | null>(null)

  useEffect(() => {
    setContext(syncArtistDirectoryNavSelection(slug))
  }, [slug])

  const navigate = useCallback(
    async (direction: "prev" | "next") => {
      const active = context ?? getArtistDirectoryNavContext()
      if (!active) return

      setLoadingDirection(direction)
      try {
        const result = await resolveAdjacentArtistDirectorySlug(direction, active)
        if (!result) return

        saveArtistDirectoryNavContext(result.context)
        setContext(result.context)
        if (onDirectoryNavigate) {
          onDirectoryNavigate(result.slug, result.context)
          return
        }
        router.push(`/artist-index/${encodeURIComponent(result.slug)}`)
      } finally {
        setLoadingDirection(null)
      }
    },
    [context, onDirectoryNavigate, router],
  )

  if (!context || context.currentIndex < 0 || context.totalMatches <= 1) {
    return null
  }

  const position = getArtistDirectoryNavPosition(context)
  const canPrev = canNavigateArtistDirectoryPrev(context)
  const canNext = canNavigateArtistDirectoryNext(context)

  const headerNav = (
    <div className="flex items-center gap-2">
      <NavArrowButton
        label="Previous artist"
        disabled={!canPrev}
        loading={loadingDirection === "prev"}
        onClick={() => void navigate("prev")}
      />
      <NavArrowButton
        label="Next artist"
        disabled={!canNext}
        loading={loadingDirection === "next"}
        onClick={() => void navigate("next")}
      />
    </div>
  )

  const footerNav = (
    <nav
      aria-label="Browse artists in directory"
      className="flex flex-col items-stretch gap-3 py-2 sm:flex-row sm:items-center sm:justify-between"
    >
      <button
        type="button"
        disabled={!canPrev || loadingDirection === "prev"}
        onClick={() => void navigate("prev")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition-colors",
          canPrev && "hover:border-[#E8192C]/40 hover:text-[#E8192C]",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        {loadingDirection === "prev" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ChevronLeft className="h-4 w-4" aria-hidden />
        )}
        Previous Artists
      </button>

      <p className="text-center text-sm font-medium text-muted-foreground">
        {position.toLocaleString()} of {context.totalMatches.toLocaleString()}
      </p>

      <button
        type="button"
        disabled={!canNext || loadingDirection === "next"}
        onClick={() => void navigate("next")}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-semibold transition-colors",
          canNext
            ? "border-[#E8192C]/50 text-[#E8192C] hover:border-[#E8192C] hover:bg-[#E8192C]/5"
            : "border-border text-foreground",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        Next Artists
        {loadingDirection === "next" ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden />
        )}
      </button>
    </nav>
  )

  if (variant === "header") return headerNav
  if (variant === "footer") return footerNav

  return (
    <>
      {headerNav}
      {footerNav}
    </>
  )
}

export function ArtistProfileDirectoryHeaderNav({
  slug,
  onDirectoryNavigate,
}: {
  slug: string
  onDirectoryNavigate?: (slug: string, context: ArtistDirectoryNavContext) => void
}) {
  return (
    <ArtistProfileDirectoryNav
      slug={slug}
      variant="header"
      onDirectoryNavigate={onDirectoryNavigate}
    />
  )
}

export function ArtistProfileDirectoryFooterNav({
  slug,
  onDirectoryNavigate,
}: {
  slug: string
  onDirectoryNavigate?: (slug: string, context: ArtistDirectoryNavContext) => void
}) {
  return (
    <ArtistProfileDirectoryNav
      slug={slug}
      variant="footer"
      onDirectoryNavigate={onDirectoryNavigate}
    />
  )
}
