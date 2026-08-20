"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

const URL_MESSAGE = "hiffi-top-artists-url"
const SCROLL_MESSAGE = "hiffi-top-artists-scroll"

type TopArtistsEmbedProps = {
  documentSrc: string
  title: string
  variant?: "ranking" | "how-it-works"
}

/**
 * Full-width Hip-Hop 500 header + body row. Sidebar opens only in the body
 * (below the header), so branding/nav stay edge-to-edge.
 */
export function TopArtistsEmbed({
  documentSrc,
  title,
  variant = "ranking",
}: TopArtistsEmbedProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeSrcRef = useRef<string | null>(null)
  const iframeDocRef = useRef(documentSrc)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const {
    isSidebarOpen,
    setIsSidebarOpen,
    isDesktopSidebarOpen,
    toggleDesktopSidebar,
    toggleMobileSidebar,
  } = useSidebar()

  // Lock iframe src after first paint. Parent URL sync (artist/mode/city) must not
  // rebuild src — that remounts the embed and looks like a full page reload.
  if (iframeDocRef.current !== documentSrc) {
    iframeDocRef.current = documentSrc
    iframeSrcRef.current = null
  }
  if (iframeSrcRef.current == null) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("embed", "1")
    const qs = params.toString()
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    iframeSrcRef.current = `${documentSrc}?${qs}${hash}`
  }
  const iframeSrc = iframeSrcRef.current

  const toggleAppSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleDesktopSidebar()
    } else {
      toggleMobileSidebar()
    }
  }, [toggleDesktopSidebar, toggleMobileSidebar])

  const scrollInEmbed = useCallback((id: string) => {
    setMobileNavOpen(false)
    const frame = iframeRef.current?.contentWindow
    if (frame) {
      frame.postMessage({ type: SCROLL_MESSAGE, id }, window.location.origin)
      return
    }
    router.push(`/top-artists#${id}`)
  }, [router])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data
      if (!data || typeof data.type !== "string") return
      if (data.type !== URL_MESSAGE || typeof data.path !== "string") return
      if (!data.path.startsWith("/top-artists")) return
      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
      if (data.path === current) return
      router.replace(data.path)
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [pathname, router, searchParams])

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#070708] text-[#f4f1ea]">
      <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-[#303034] bg-[#070708]/[0.96] px-4 backdrop-blur-md sm:h-20 sm:gap-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleAppSidebar}
            className="grid h-9 w-9 shrink-0 place-content-center gap-[5px] border border-[#303034] hover:border-[#ff2b2b] sm:h-[42px] sm:w-[42px]"
            aria-label="Open Hiffi menu"
          >
            <span className="block h-[1.5px] w-4 bg-[#f4f1ea]" />
            <span className="block h-[1.5px] w-4 bg-[#f4f1ea]" />
            <span className="block h-[1.5px] w-4 bg-[#f4f1ea]" />
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Hiffi home">
            <Image
              src="/appbarlogo.png"
              alt="Hiffi"
              width={132}
              height={31}
              className="h-[18px] w-auto object-contain sm:h-[31px]"
              style={{ width: "auto" }}
              priority
            />
          </Link>
          <Link
            href="/top-artists"
            className="min-w-0 truncate text-lg font-black uppercase leading-none tracking-tight sm:text-[31px]"
            style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
            aria-label="Hip-Hop 500 home"
          >
            HIP-HOP <span className="text-[#ff2b2b]">500</span>
          </Link>
        </div>

        <nav
          className={cn(
            "absolute left-0 right-0 top-16 z-40 grid bg-[#ff2b2b] sm:top-20 lg:static lg:flex lg:flex-1 lg:justify-center lg:gap-[clamp(38px,7vw,100px)] lg:bg-transparent",
            mobileNavOpen ? "grid" : "hidden lg:flex",
          )}
          aria-label="Primary navigation"
        >
          {variant === "ranking" ? (
            <>
              <button
                type="button"
                className="h-[62px] px-[18px] text-left text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => scrollInEmbed("leaderboard")}
              >
                Leaderboard
              </button>
              <button
                type="button"
                className="h-[62px] px-[18px] text-left text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => scrollInEmbed("movers")}
              >
                Movers
              </button>
              <Link
                href="/top-artists/how-it-works"
                className="flex h-[62px] items-center px-[18px] text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => setMobileNavOpen(false)}
              >
                How it works
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/top-artists#leaderboard"
                className="flex h-[62px] items-center px-[18px] text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => setMobileNavOpen(false)}
              >
                Leaderboard
              </Link>
              <Link
                href="/top-artists#movers"
                className="flex h-[62px] items-center px-[18px] text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => setMobileNavOpen(false)}
              >
                Movers
              </Link>
              <Link
                href="/top-artists/how-it-works"
                aria-current="page"
                className="flex h-[62px] items-center px-[18px] text-sm font-extrabold uppercase tracking-[0.15em] text-white lg:h-auto lg:px-0 lg:text-[#f4f1ea]"
                style={{ fontFamily: '"Arial Narrow", Arial, sans-serif' }}
                onClick={() => setMobileNavOpen(false)}
              >
                How it works
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {variant === "ranking" && (
            <button
              type="button"
              className="hidden h-12 w-12 place-items-center border border-[#ff2b2b] text-[#ff2b2b] hover:bg-[#ff2b2b] hover:text-white sm:grid"
              aria-label="Explore the ranking"
              onClick={() => scrollInEmbed("leaderboard")}
            >
              <span className="text-2xl leading-none">↘</span>
            </button>
          )}
          <button
            type="button"
            className="grid h-9 w-9 place-content-center gap-1.5 border border-[#303034] lg:hidden"
            aria-expanded={mobileNavOpen}
            aria-label="Toggle page menu"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span className="block h-px w-[18px] bg-[#ff2b2b]" />
            <span className="block h-px w-[18px] bg-[#ff2b2b]" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          insetBelowHeader
          isMobileOpen={isSidebarOpen}
          onMobileClose={() => setIsSidebarOpen(false)}
          isDesktopOpen={isDesktopSidebarOpen}
          onDesktopToggle={() => toggleDesktopSidebar()}
        />
        <iframe
          ref={iframeRef}
          title={title}
          src={iframeSrc}
          className="block min-h-0 min-w-0 flex-1 border-0 bg-[#070708]"
          allow="clipboard-write"
          onLoad={() => {
            if (variant !== "ranking") return
            const id = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : ""
            if (id) scrollInEmbed(id)
          }}
        />
      </div>
    </div>
  )
}
