import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, Box, ChevronRight, Crown, Home, List, MapPin, Music, Plus } from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import type { AtlantaCategory } from "@/lib/atlanta/types"
import { ATLANTA_HUB, ATLANTA_HUB_CATEGORIES, ATLANTA_HUB_QUICK_LINKS } from "@/lib/atlanta/hub"
import { buildAtlantaMetadata } from "@/lib/atlanta/metadata"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

export const metadata: Metadata = buildAtlantaMetadata({
  title: ATLANTA_HUB.title,
  description: ATLANTA_HUB.description,
  path: "/atlanta",
  keywords: ATLANTA_HUB.keywords,
})

const ARTISTS_HREF = "/artist-index/city/atlanta"
const SCENE_GUIDE_HREF = "/artist-index/city/atlanta/scene"
const ARTIST_INDEX_HREF = "/artist-index"
const CATEGORIES_HREF = "/hip-hop"
const FAQ_HREF = "/faq"

const categoryIcons: Record<AtlantaCategory, LucideIcon> = {
  genres: Music,
  "best-of": List,
  eras: Box,
  studios: Home,
  venues: MapPin,
}

const faqItems = [
  {
    question: "What is the Atlanta Hip-Hop Guide?",
    answer:
      "The Hiffi Atlanta Hip-Hop Guide is a discovery hub for Atlanta's hip-hop scene. Browse independent artists, rap music, official music videos, genres, studios, venues, and curated guides in one place.",
  },
  {
    question: "How can I discover new Atlanta hip-hop artists?",
    answer:
      "Browse the Hiffi Artist Index to discover independent Atlanta rappers, producers, DJs, and beatmakers. Explore artist profiles, official music videos, and curated collections featuring emerging talent.",
  },
  {
    question: "What hip-hop genres are popular in Atlanta?",
    answer:
      "Atlanta is known for trap music, Southern hip-hop, drill, melodic rap, and conscious rap. The Atlanta Hip-Hop Guide helps you explore these genres through artist profiles, music videos, and curated content.",
  },
  {
    question: "Can I browse Atlanta artists by genre?",
    answer:
      "Yes. You can explore Atlanta hip-hop by genre, including trap, drill, Southern hip-hop, and other styles. Hiffi also connects genre pages with artist profiles and music discovery.",
  },
  {
    question: "Where can I find independent Atlanta rap artists?",
    answer:
      "The Hiffi Artist Index features independent Atlanta rappers, producers, DJs, and beatmakers. Browse artist profiles, watch official music videos, and discover emerging talent across the city.",
  },
  {
    question: "Can Atlanta artists claim their Hiffi profile?",
    answer:
      "Yes. Artists can claim their profile on Hiffi to manage their information, connect official links, and build their presence within the Hiffi Artist Index.",
  },
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
const primaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] transition-colors hover:bg-primary/90",
  focusRing,
)
const darkSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/40 bg-transparent px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10",
  focusRing,
)
const lightSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
  focusRing,
)
const sideLink = cn(
  "inline-flex items-center gap-1 whitespace-nowrap rounded text-xs font-semibold text-primary hover:underline",
  focusRing,
)

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-2.5">
      <span className="text-2xl font-bold leading-none text-primary sm:text-[1.75rem]" aria-hidden>
        {number}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{children}</span>
    </p>
  )
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
      {children}
    </h2>
  )
}

/** Simplified Atlanta skyline: [x, width, height, roof] on a 400×200 canvas. */
const SKYLINE: Array<[number, number, number, "flat" | "peak" | "spire"]> = [
  [0, 22, 40, "flat"],
  [30, 30, 110, "flat"],
  [68, 34, 165, "peak"],
  [110, 26, 95, "flat"],
  [144, 40, 70, "flat"],
  [192, 30, 135, "flat"],
  [230, 26, 185, "spire"],
  [264, 36, 120, "peak"],
  [308, 24, 60, "flat"],
  [340, 30, 150, "flat"],
  [378, 22, 85, "flat"],
]

function Skyline({ className, opacities = [0.55, 0.85] }: { className?: string; opacities?: [number, number] }) {
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax meet" className={className} aria-hidden>
      {SKYLINE.map(([x, w, h, roof], i) => {
        const top = 200 - h
        const opacity = opacities[i % 2]
        return (
          <g key={x} fill="currentColor" opacity={opacity}>
            <rect x={x} y={top} width={w} height={h} />
            {roof === "peak" ? <polygon points={`${x},${top} ${x + w / 2},${top - 18} ${x + w},${top}`} /> : null}
            {roof === "spire" ? <rect x={x + w / 2 - 1.5} y={top - 22} width={3} height={22} /> : null}
          </g>
        )
      })}
    </svg>
  )
}

function FaqAccordion() {
  return (
    <div className="mt-8 space-y-3">
      {faqItems.map((item) => (
        <details
          key={item.question}
          className="group rounded-xl border border-border bg-background transition-colors open:border-primary/30 hover:border-primary/30"
        >
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-4 text-sm font-semibold text-foreground sm:px-5 [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            {item.question}
            <Plus
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 group-open:text-primary"
              aria-hidden
            />
          </summary>
          <p className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-5">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}

export default function AtlantaHubPage() {
  const jsonLd = buildContentPageJsonLd({
    path: "/atlanta",
    title: ATLANTA_HUB.title,
    description: ATLANTA_HUB.description,
    breadcrumbLabel: ATLANTA_HUB.title,
    faqItems,
  })

  return (
    <div className="overflow-x-clip bg-background">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section aria-labelledby="atlanta-hero-heading" className="relative isolate overflow-hidden bg-[#0b0b0f] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#0b0b0f_35%,#3a0a10_75%,#5c0d16_100%)]"
          aria-hidden
        />
        <Skyline
          className="absolute bottom-0 right-0 -z-10 h-[70%] w-auto max-w-[60%] text-primary/60 sm:h-[85%]"
          opacities={[0.35, 0.55]}
        />

        <div className={cn(container, "grid items-center gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]")}>
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/70">
                <li>
                  <Link href="/" className="rounded transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3 w-3" />
                </li>
                <li className="font-medium text-white" aria-current="page">
                  Atlanta
                </li>
              </ol>
            </nav>

            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Atlanta</p>
            <h1 id="atlanta-hero-heading" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem]">
              Atlanta <span className="text-primary">Hip-Hop Guide</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/80">{ATLANTA_HUB.description}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={ARTISTS_HREF} className={primaryButton}>
                Browse Atlanta artists
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={SCENE_GUIDE_HREF} className={darkSecondaryButton}>
                Read the scene guide
              </Link>
            </div>
          </div>

          <div className="relative hidden justify-self-end pr-2 sm:block" aria-hidden>
            <Crown className="ml-auto h-9 w-9 text-white" strokeWidth={2.25} />
            <p className="mt-6 -rotate-3 text-right text-4xl font-black uppercase leading-[1.05] tracking-tight text-white [text-shadow:0_0_24px_rgba(237,28,47,0.85)] lg:text-[2.6rem]">
              Atlanta
              <br />
              Music
              <br />
              Culture
            </p>
          </div>
        </div>
      </section>

      {/* 01 Browse by category */}
      <section aria-labelledby="atlanta-categories-heading" className={cn(container, "pt-12 sm:pt-14")}>
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel number="01">Browse by category</SectionLabel>
            <SectionHeading id="atlanta-categories-heading">Explore Atlanta Hip-Hop</SectionHeading>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Atlanta isn&apos;t just a city tag — it&apos;s a full stack of sounds, rooms, labels, and timelines.
              Start with a category, jump into a best-of list, or walk eras in order.
            </p>
          </div>
          <Link href={CATEGORIES_HREF} className={sideLink}>
            View all categories →
          </Link>
        </div>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {ATLANTA_HUB_CATEGORIES.map((card) => {
            const Icon = categoryIcons[card.category]
            return (
              <li key={card.category}>
                <Link
                  href={card.href}
                  className={cn(
                    "group flex h-full items-start gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary/40",
                    focusRing,
                  )}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-primary dark:bg-primary/15"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground group-hover:text-primary">
                      {card.title}
                    </span>
                    <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                      {card.description}
                    </span>
                  </span>
                  <span
                    className="mt-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-primary/15"
                    aria-hidden
                  >
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 02 Start here */}
      <section aria-labelledby="atlanta-start-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionLabel number="02">Start here</SectionLabel>
            <SectionHeading id="atlanta-start-heading">Jump into Atlanta guides</SectionHeading>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              Not sure where to begin? Here are some popular starting points to explore Atlanta hip-hop on Hiffi.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {ATLANTA_HUB_QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex rounded-full border border-border bg-muted/40 px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
                      focusRing,
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0b0b0f_0%,#2a070b_55%,#4a0b12_100%)] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.7)]"
            aria-hidden
          >
            <Skyline className="absolute bottom-0 left-0 h-[78%] w-auto text-primary" opacities={[0.45, 0.7]} />
            <p className="absolute right-6 top-1/2 -translate-y-1/2 text-right text-2xl font-black uppercase leading-[1.1] tracking-tight text-white sm:right-8 sm:text-3xl">
              Atlanta
              <br />
              Hip-Hop
              <br />
              Scene
            </p>
          </div>
        </div>
      </section>

      {/* 03 Atlanta artists */}
      <section aria-labelledby="atlanta-artists-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionLabel number="03">Atlanta artists</SectionLabel>
            <SectionHeading id="atlanta-artists-heading">Discover Atlanta Hip-Hop Artists</SectionHeading>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Browse independent Atlanta rappers, producers, DJs, and beatmakers. Explore artist profiles, official
              music videos, and curated collections featuring emerging talent.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={ARTISTS_HREF} className={primaryButton}>
                Browse Atlanta artists
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={ARTIST_INDEX_HREF} className={lightSecondaryButton}>
                Explore Artist Index
              </Link>
            </div>
          </div>

          <div
            className="relative aspect-[2/1] overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white dark:border-primary/20 dark:from-primary/10 dark:to-background"
            aria-hidden
          >
            <p className="absolute inset-x-0 top-[22%] text-center text-[5.5rem] font-black leading-none tracking-tight text-primary/15 sm:text-[7rem]">
              ATL
            </p>
            <Skyline
              className="absolute bottom-[10%] left-1/2 h-[55%] w-auto -translate-x-1/2 text-primary/50"
              opacities={[0.6, 0.85]}
            />
            <Crown className="absolute right-[14%] top-[14%] h-8 w-8 text-primary" strokeWidth={2.5} />
          </div>
        </div>
      </section>

      {/* 04 FAQ */}
      <section aria-labelledby="atlanta-faq-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel number="04">Popular questions</SectionLabel>
            <SectionHeading id="atlanta-faq-heading">Frequently Asked Questions</SectionHeading>
            <p className="mt-3 text-sm text-muted-foreground">
              Quick answers to help you explore Atlanta hip-hop on Hiffi.
            </p>
          </div>
          <Link href={FAQ_HREF} className={sideLink}>
            View all FAQs →
          </Link>
        </div>
        <FaqAccordion />
      </section>

      {/* 05 Explore more */}
      <div className={cn(container, "pb-6 pt-6 sm:pb-10")}>
        <section
          aria-labelledby="atlanta-explore-heading"
          className="grid items-center gap-10 rounded-3xl border border-border bg-[#fafafa] px-6 py-10 dark:bg-muted/40 sm:px-10 sm:py-14 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
        >
          <div>
            <SectionLabel number="05">Explore more</SectionLabel>
            <SectionHeading id="atlanta-explore-heading">Keep exploring Atlanta</SectionHeading>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Browse living artist profiles or dig into the longer scene guide.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={ARTISTS_HREF} className={primaryButton}>
                Browse Atlanta artists
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={SCENE_GUIDE_HREF} className={lightSecondaryButton}>
                Read the scene guide
              </Link>
            </div>
          </div>

          {/* Turntable artwork */}
          <div className="relative mx-auto w-full max-w-[200px] md:mr-6" aria-hidden>
            <Crown className="absolute -left-3 -top-5 z-10 h-8 w-8 text-primary" strokeWidth={2.5} />
            <div className="relative aspect-square rounded-2xl bg-primary shadow-[0_20px_40px_-18px_rgba(237,28,47,0.6)] ring-4 ring-white dark:ring-background">
              <div className="absolute inset-[9%] flex items-center justify-center rounded-full bg-[radial-gradient(circle,#2a2a30_0%,#16161a_45%,#1f1f24_46%,#121215_70%,#1c1c21_71%,#0f0f12_100%)]">
                <div className="flex h-[26%] w-[26%] items-center justify-center rounded-full bg-primary">
                  <div className="h-[28%] w-[28%] rounded-full bg-white" />
                </div>
              </div>
              <div className="absolute bottom-[6%] left-[6%] flex h-[10%] w-[10%] items-center justify-center rounded-full bg-[#16161a] ring-2 ring-primary/40">
                <div className="h-1/3 w-1/3 rounded-full bg-white/60" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
