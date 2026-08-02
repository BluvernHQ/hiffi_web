"use client"

import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"
import { artistIndexCitySceneHref } from "@/lib/artist-directory"
import { getAtlantaSceneTeaser } from "@/lib/artist-index/city-seo-content"
import { artistPanelShell } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type FaqItem = {
  question: string
  answer: string
}

type ArtistCityEditorialFooterProps = {
  citySlug: string
  cityLabel: string
  profileCount: number
  faqItems: readonly FaqItem[]
  genreLinks: Array<{ label: string; href: string }>
  className?: string
}

/**
 * Polished post-grid footer for city directory pages:
 * scene CTA + compact accordion FAQ (no SEO keyword walls).
 */
export function ArtistCityEditorialFooter({
  citySlug,
  cityLabel,
  profileCount,
  faqItems,
  genreLinks,
  className,
}: ArtistCityEditorialFooterProps) {
  if (citySlug !== "atlanta") return null

  const teaser = getAtlantaSceneTeaser(profileCount)

  return (
    <div className={cn("space-y-6", className)}>
      <aside
        className={cn(
          artistPanelShell,
          "border border-border/70 bg-gradient-to-br from-muted/40 via-background to-background px-5 py-6 sm:px-7 sm:py-7",
        )}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E8192C]">
              About the {cityLabel} scene
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Go deeper on Atlanta hip-hop
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {teaser}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href={artistIndexCitySceneHref(citySlug)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E8192C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d01528]"
            >
              Scene guide
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/atlanta"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              Atlanta guide
            </Link>
          </div>
        </div>

        <nav
          aria-label="Browse related Atlanta pages"
          className="mt-5 flex flex-wrap gap-2 border-t border-border/60 pt-5"
        >
          {genreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {faqItems.length > 0 ? (
        <section
          aria-labelledby="atlanta-city-faq-heading"
          className={cn(artistPanelShell, "border border-border/70 bg-background px-5 py-6 sm:px-7 sm:py-7")}
        >
          <div className="max-w-2xl">
            <h2 id="atlanta-city-faq-heading" className="text-xl font-bold tracking-tight text-foreground">
              FAQ
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Quick answers about browsing and claiming Atlanta artist profiles.
            </p>
          </div>

          <div className="mt-5 divide-y divide-border/70 border-t border-border/70">
            {faqItems.map((item) => (
              <details key={item.question} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                    {item.question}
                  </span>
                  <ChevronDown
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
