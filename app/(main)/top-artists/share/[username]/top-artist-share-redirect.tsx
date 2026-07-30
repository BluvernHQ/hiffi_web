"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Human bounce to the live ranking; crawlers still receive OG from the server page. */
export function TopArtistShareRedirect({ href }: { href: string }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(href)
  }, [href, router])

  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[#080807] px-6 text-center text-[#f4f1ea]">
      <p className="text-sm uppercase tracking-widest text-[#ff2b2b]">Hiffi Hip-Hop 500</p>
      <p className="max-w-md text-base text-white/80">Opening the live ranking…</p>
      <a
        href={href}
        className="mt-2 inline-flex items-center gap-2 border border-[#ff2b2b] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#ff2b2b] hover:bg-[#ff2b2b] hover:text-white"
      >
        Continue <span aria-hidden>→</span>
      </a>
    </main>
  )
}
