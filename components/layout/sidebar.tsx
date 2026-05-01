"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { checkUploadNavigationGuard } from "@/lib/upload-navigation-guard"
import { cn } from "@/lib/utils"
import {
  Home,
  History,
  ListMusic,
  Sparkles,
  ThumbsUp,
  UserCheck,
  Loader2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { setPlaylistSession } from "@/lib/playlist-session"
import { CURATED_PLAYLISTS_UPDATED_EVENT } from "@/lib/curated-playlists-events"

interface SidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isDesktopOpen?: boolean
  onDesktopToggle?: () => void
  currentFilter?: 'all' | 'following' | 'liked' | 'history'
  onFilterChange?: (filter: 'all' | 'following' | 'liked' | 'history') => void
}

export function Sidebar({ className, isMobileOpen = false, onMobileClose, isDesktopOpen = false, onDesktopToggle, currentFilter = 'all', onFilterChange }: SidebarProps) {
  const { user, userData } = useAuth()
  const pathname = usePathname()
  const isAppDownloadPage = pathname === "/app"
  const router = useRouter()
  const [internalMobileOpen, setInternalMobileOpen] = useState(false)
  const isHomePage = pathname === "/"
  const [activeCuratedPlaylistId, setActiveCuratedPlaylistId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !pathname?.startsWith("/watch/")) {
      setActiveCuratedPlaylistId(null)
      return
    }

    const params = new URLSearchParams(window.location.search)
    setActiveCuratedPlaylistId(params.get("playlist"))
  }, [pathname])

  type CuratedPlaylistSummary = {
    playlistId: string
    title: string
    description?: string
    item_count?: number
  }

  const [curatedPlaylists, setCuratedPlaylists] = useState<CuratedPlaylistSummary[]>([])
  const [curatedLoading, setCuratedLoading] = useState(true)
  const [curatedActionLoadingId, setCuratedActionLoadingId] = useState<string | null>(null)
  const [curatedFirstVideoById, setCuratedFirstVideoById] = useState<Record<string, string>>({})
  const curatedClickRequestSeqRef = useRef(0)

  // Use external state if provided, otherwise use internal state
  const mobileOpen = isMobileOpen !== undefined ? isMobileOpen : internalMobileOpen

  // Close handler: use external close function if provided, otherwise use internal state setter
  const closeSidebar = () => {
    if (onMobileClose) {
      onMobileClose()
    } else {
      setInternalMobileOpen(false)
    }
  }

  const loadCuratedPlaylists = useCallback(async () => {
    try {
      setCuratedLoading(true)

      const listRes = await apiClient.listCuratedPlaylists({ limit: 3, offset: 0 })
      const next = (listRes.playlists || [])
        .filter((p) => Boolean(p.playlist_id) && Boolean(p.title))
        .map((p) => ({
          playlistId: p.playlist_id,
          title: p.title,
          description: p.description,
          item_count: p.item_count,
        }))

      setCuratedPlaylists(next)
    } catch {
      // no-op; curated mix is optional
    } finally {
      setCuratedLoading(false)
    }
  }, [])

  // Load the latest curated/admin mix for all users and refresh when changed elsewhere.
  useEffect(() => {
    let cancelled = false
    const safeLoad = async () => {
      if (cancelled) return
      await loadCuratedPlaylists()
    }
    void safeLoad()

    const handleCuratedPlaylistsUpdated = () => {
      void safeLoad()
    }
    window.addEventListener(CURATED_PLAYLISTS_UPDATED_EVENT, handleCuratedPlaylistsUpdated)

    return () => {
      cancelled = true
      window.removeEventListener(CURATED_PLAYLISTS_UPDATED_EVENT, handleCuratedPlaylistsUpdated)
    }
  }, [loadCuratedPlaylists])

  // Prefetch the first playable video id per curated playlist so clicks can navigate instantly.
  useEffect(() => {
    if (!curatedPlaylists.length) {
      setCuratedFirstVideoById({})
      return
    }

    let cancelled = false
    ;(async () => {
      const next: Record<string, string> = {}

      await Promise.all(
        curatedPlaylists.map(async (playlist) => {
          try {
            const detail = await apiClient.getCuratedPlaylist(playlist.playlistId, { limit: 1, offset: 0 })
            const firstVideoId = (detail.items || []).map((it) => it.video_id).find(Boolean)
            if (firstVideoId) {
              next[playlist.playlistId] = firstVideoId
            }
          } catch {
            // ignore prefetch failures; click flow has fallback handling
          }
        }),
      )

      if (!cancelled) setCuratedFirstVideoById(next)
    })()

    return () => {
      cancelled = true
    }
  }, [curatedPlaylists])

  type SidebarNavItem = {
    icon: typeof Home
    label: string
    href: string
    requireAuth?: boolean
  }

  type SidebarFilterItem = SidebarNavItem & {
    value: "all" | "following" | "liked" | "history"
  }

  // Removed mainNavItems - "All Videos" filter serves as the home navigation
  const mainNavItems: SidebarNavItem[] = []

  const filterItems: SidebarFilterItem[] = [
    { icon: Home, label: "Home", value: "all" as const, href: "/" },
  ]

  const secondaryNavItems: SidebarNavItem[] = [
    { icon: History, label: "History", href: "/history" },
    { icon: ThumbsUp, label: "Liked Videos", href: "/liked" },
    { icon: ListMusic, label: "Playlists", href: "/playlists", requireAuth: true },
    { icon: UserCheck, label: "Following", href: "/following", requireAuth: true },
  ]

  /**
   * Determines if a navigation item is active based on the current pathname.
   * Uses exact match for home, prefix match for other routes.
   */
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  const NavLink = ({ item }: { item: SidebarNavItem }) => {
    const Icon = item.icon
    const itemIsActive = isActive(item.href)

    if (item.requireAuth && !user) return null

    return (
      <Link
        href={item.href}
        data-analytics-name={`sidebar_${item.label.toLowerCase().replace(/\s+/g, "_")}_link`}
        className={cn(
          // Standardized spacing and sizing - matches FilterItem exactly
          "flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
          isAppDownloadPage ? "text-foreground/90" : "text-foreground",
          // Hover state
          "hover:bg-accent hover:text-accent-foreground",
          // Active state - consistent visual treatment
          itemIsActive && "bg-accent text-accent-foreground font-semibold"
        )}
        onClick={closeSidebar}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </Link>
    )
  }

  const FilterItem = ({ item }: { item: SidebarFilterItem }) => {
    const Icon = item.icon
    const isDisabled = item.requireAuth && !user

    // Simplified active state: use pathname matching for consistency
    // Home is active when pathname is exactly "/"
    // Following is active when pathname starts with "/following"
    const isItemActive = isActive(item.href)

    if (isDisabled) return null

    // Navigate to the proper route
    const handleClick = () => {
      if (item.href) {
        const { shouldBlock, message } = checkUploadNavigationGuard()
        if (shouldBlock && typeof window !== "undefined" && !window.confirm(message)) {
          return
        }
        router.push(item.href)
      } else if (isHomePage && onFilterChange) {
        // Fallback for home page filters
        onFilterChange(item.value)
      }
      closeSidebar()
    }

    return (
      <button
        onClick={handleClick}
        data-analytics-name={`sidebar_${item.label.toLowerCase().replace(/\s+/g, "_")}_button`}
        className={cn(
          // Standardized spacing and sizing - never changes
          "w-full flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium transition-colors text-left",
          isAppDownloadPage ? "text-foreground/90" : "text-foreground",
          // Hover state
          "hover:bg-accent hover:text-accent-foreground",
          // Active state - consistent visual treatment
          isItemActive && "bg-accent text-accent-foreground font-semibold"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{item.label}</span>
      </button>
    )
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Consistent dimensions and positioning across all pages */}
      <aside
        className={cn(
          // Fixed width - never changes (256px / w-64) when open
          "flex-shrink-0 bg-background",
          // Mobile: fixed overlay, always w-64
          "fixed left-0 top-0 z-[70] h-[100dvh] w-64 shadow-lg transition-transform duration-300 ease-in-out",
          // Desktop: sticky positioning below navbar, can be hidden
          // top-16 = 4rem = navbar height; use 100dvh to match app layout so footer isn't clipped
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100dvh-4rem)] lg:shadow-none lg:transition-all lg:duration-300 lg:ease-in-out",
          // Desktop overflow - hidden so only inner nav scrolls; footer stays visible
          "lg:overflow-hidden",
          // Mobile visibility
          !mobileOpen && "-translate-x-full",
          // Desktop visibility - hidden by default (no width, translated out), shown when isDesktopOpen is true
          !isDesktopOpen && "lg:w-0 lg:-translate-x-full",
          isDesktopOpen && "lg:w-64 lg:translate-x-0",
          className
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden shrink-0">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation - Consistent padding across all pages */}
            <nav className="space-y-1 p-4 lg:p-4 lg:pt-4">
              {/* Main navigation items */}
              {mainNavItems.length > 0 && (
                <div className="space-y-1">
                  {mainNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              )}

              {/* Filter options - always show Explore section */}
              <div className={mainNavItems.length > 0 ? "pt-4" : ""}>
                <div
                  className={cn(
                    "mb-2 px-4 text-xs font-semibold uppercase tracking-wider",
                    isAppDownloadPage ? "text-foreground/80" : "text-muted-foreground",
                  )}
                >
                  Explore
                </div>
                <div className="space-y-1">
                  {filterItems.map((item) => (
                    <FilterItem key={item.value} item={item} />
                  ))}
                </div>
              </div>

              {(curatedLoading || curatedPlaylists.length > 0) && (
                <div className="pt-4">
                  <div
                    className={cn(
                      "mb-2 px-4 text-xs font-semibold uppercase tracking-wider",
                      isAppDownloadPage ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    Curated Mix
                  </div>

                  {curatedLoading ? (
                    <div className="space-y-1 px-4">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="h-[3.25rem] rounded-xl border border-border/60 bg-muted/40 animate-shimmer"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5 px-4">
                      {curatedPlaylists.map((p) => {
                        const isLoading = curatedActionLoadingId === p.playlistId
                        const isSelected = activeCuratedPlaylistId === p.playlistId
                        return (
                          <button
                            key={p.playlistId}
                            type="button"
                            onClick={async () => {
                              const requestSeq = ++curatedClickRequestSeqRef.current
                              setActiveCuratedPlaylistId(p.playlistId)
                              setCuratedActionLoadingId(p.playlistId)
                              try {
                                const timeoutMs = 7000
                                const detail = await Promise.race([
                                  apiClient.getCuratedPlaylist(p.playlistId, { limit: 100, offset: 0 }),
                                  new Promise<null>((resolve) => {
                                    setTimeout(() => resolve(null), timeoutMs)
                                  }),
                                ])

                                const fetchedVideoIds =
                                  detail && detail.items ? detail.items.map((it) => it.video_id).filter(Boolean) : []
                                const fallbackFirstVideoId = curatedFirstVideoById[p.playlistId]
                                let firstVideoId: string | undefined = fetchedVideoIds[0] || fallbackFirstVideoId

                                // If full fetch timed out and cache is cold, do a small targeted fetch for first playable item.
                                if (!firstVideoId) {
                                  const firstDetail = await Promise.race([
                                    apiClient.getCuratedPlaylist(p.playlistId, { limit: 1, offset: 0 }),
                                    new Promise<null>((resolve) => {
                                      setTimeout(() => resolve(null), 3500)
                                    }),
                                  ])
                                  firstVideoId =
                                    firstDetail && firstDetail.items
                                      ? firstDetail.items.map((it) => it.video_id).find(Boolean)
                                      : undefined
                                }

                                if (!firstVideoId) return
                                const ensuredFirstVideoId = firstVideoId

                                const sessionVideoIds = fetchedVideoIds.length ? fetchedVideoIds : [ensuredFirstVideoId]
                                if (requestSeq !== curatedClickRequestSeqRef.current) return

                                setPlaylistSession({
                                  playlistId: p.playlistId,
                                  title: detail?.playlist?.title || p.title || "Curated Mix",
                                  videoIds: sessionVideoIds,
                                  currentIndex: 0,
                                  autoplay: true,
                                })

                                closeSidebar()
                                router.push(
                                  `/watch/${encodeURIComponent(ensuredFirstVideoId)}?playlist=${encodeURIComponent(p.playlistId)}&pindex=0`,
                                )
                              } catch {
                                const fallbackFirstVideoId = curatedFirstVideoById[p.playlistId]
                                if (fallbackFirstVideoId) {
                                  if (requestSeq !== curatedClickRequestSeqRef.current) return
                                  setActiveCuratedPlaylistId(p.playlistId)
                                  setPlaylistSession({
                                    playlistId: p.playlistId,
                                    title: p.title || "Curated Mix",
                                    videoIds: [fallbackFirstVideoId],
                                    currentIndex: 0,
                                    autoplay: true,
                                  })
                                  closeSidebar()
                                  router.push(
                                    `/watch/${encodeURIComponent(fallbackFirstVideoId)}?playlist=${encodeURIComponent(p.playlistId)}&pindex=0`,
                                  )
                                }
                              } finally {
                                if (requestSeq === curatedClickRequestSeqRef.current) {
                                  setCuratedActionLoadingId(null)
                                }
                              }
                            }}
                            className={cn(
                              "group relative w-full flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all",
                              "bg-background/95 border border-border/80 hover:bg-muted/45 hover:border-border hover:shadow-sm",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              isSelected && "border-primary/35 bg-primary/[0.05]",
                              isLoading && "opacity-70 pointer-events-none",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "absolute left-0 top-1.5 bottom-1.5 w-px rounded-full bg-transparent transition-colors",
                                isSelected ? "bg-primary/70" : "group-hover:bg-border",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div
                                className={cn(
                                  "relative truncate pl-5 text-sm font-semibold tracking-tight",
                                  isAppDownloadPage ? "text-foreground/90" : "text-foreground",
                                )}
                              >
                                <Sparkles
                                  aria-hidden="true"
                                  className={cn(
                                    "absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/30 transition-colors",
                                    isSelected && "text-primary/55",
                                  )}
                                />
                                {p.title}
                              </div>
                              {p.description ? (
                                <div
                                  className={cn(
                                    "mt-0.5 line-clamp-1 text-[11px] leading-4",
                                    isAppDownloadPage ? "text-foreground/75" : "text-muted-foreground/90",
                                  )}
                                >
                                  {p.description}
                                </div>
                              ) : null}
                            </div>
                            <div
                              className={cn(
                                "flex-shrink-0 text-muted-foreground/80 transition-all duration-200",
                                !isLoading && "group-hover:text-foreground group-hover:translate-x-0.5",
                                isSelected && "text-primary",
                              )}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <span className="text-base leading-none">{isSelected ? "●" : "→"}</span>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {user && secondaryNavItems.length > 0 && (
              <div className="pt-4">
                <div
                  className={cn(
                    "mb-2 px-4 text-xs font-semibold uppercase tracking-wider",
                    isAppDownloadPage ? "text-foreground/80" : "text-muted-foreground",
                  )}
                >
                  Your Activity
                </div>
                <div className="space-y-1">
                  {secondaryNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </div>
              </div>
            )}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div className="border-t px-4 py-4 mt-auto shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))] mb-[env(safe-area-inset-bottom)]">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5">
                <Link
                  href="/terms-of-use"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/terms-of-use")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  Terms of Use
                </Link>
                <Link
                  href="/payment-terms"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/payment-terms")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  Payment Terms
                </Link>
                <Link
                  href="/privacy-policy"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/privacy-policy")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/faq"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/faq")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  FAQ
                </Link>
                <Link
                  href="/app"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/app")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  Download Hiffi App
                </Link>
                <Link
                  href="/support"
                  className={cn(
                    "text-xs transition-colors",
                    isAppDownloadPage
                      ? "text-foreground/85 hover:text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={(e) => {
                    const { shouldBlock, message } = checkUploadNavigationGuard()
                    if (shouldBlock) {
                      e.preventDefault()
                      if (typeof window !== "undefined" && window.confirm(message)) {
                        closeSidebar()
                        router.push("/support")
                      }
                    } else {
                      closeSidebar()
                    }
                  }}
                >
                  Support
                </Link>
              </div>
              <div className={cn("text-xs mt-1", isAppDownloadPage ? "text-foreground/70" : "text-muted-foreground")}>
                © 2026 Kinimi Corporation
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

