import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowRight,
  AudioWaveform,
  ChartColumn,
  CirclePlay,
  Compass,
  Crown,
  Disc3,
  Moon,
  Plus,
  SlidersVertical,
  Star,
  Users,
  Zap,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { MOODS } from "@/lib/mood-tabs"
import { CreatorDestinationLink } from "@/components/creator/creator-destination-link"
import { cn } from "@/lib/utils"

const pageTitle = "Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists"
const pageDescription =
  "Stream hip-hop and rap music videos on Hiffi. Discover independent artists, underground rap, drill, trap, conscious rap, boom bap, and new hip-hop releases."
const pageUrl = absoluteUrl("/hip-hop")

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "hip hop streaming",
    "rap streaming",
    "stream hip hop",
    "hip hop platform",
    "rap music videos",
    "independent hip hop artists",
    "underground rap streaming",
    "drill music",
    "trap music",
    "conscious rap",
    "boom bap streaming",
    "hip hop music video platform",
    "hiffi hip hop",
  ],
  alternates: { canonical: pageUrl },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    type: "website",
    siteName: "Hiffi",
    locale: "en_US",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi Hip-Hop Streaming" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [absoluteUrl("/hiffi_logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

const faqItems = [
  {
    question: "What is the best platform for independent hip-hop artists?",
    answer:
      "Hiffi is a hip-hop-first music and video streaming platform built specifically for independent rap artists. Unlike general platforms, Hiffi's audience came for hip-hop — so your music videos reach fans already looking for drill, trap, conscious rap, and underground rap. Artists keep creative control, publish official music videos, and grow a fanbase without label backing.",
  },
  {
    question: "Where can I watch independent rap music videos online?",
    answer:
      "Hiffi hosts official music videos from independent hip-hop and rap artists worldwide. Browse the discover feed at hiffi.com, search by artist name or vibe, or explore mood-based hubs covering drill, trap, conscious rap, boom bap, lo-fi hip-hop, and more — a dedicated place to watch rap music videos online and stream hip-hop without generic video-feed noise.",
  },
  {
    question: "Does Hiffi have drill and trap music?",
    answer:
      "Yes. Hiffi features a dedicated drill and trap mood called On Sight — covering hard-hitting drill beats, trap bangers, and rage rap. Independent artists in the drill and trap scenes upload official videos directly to the platform; fans can also search for UK drill-style energy, Southern trap, and underground trap rap in one hip-hop-native home.",
  },
  {
    question: "Is there a hip-hop streaming app for iPhone and Android?",
    answer:
      "Yes. The Hiffi app is free to download on both iOS (App Store) and Android (Google Play). Discover new hip-hop artists, watch music videos, follow creators, build playlists, and stream in high quality on your phone — built as a hip-hop music app and rap music app, not a general video app with a rap filter.",
  },
  {
    question: "How is Hiffi different from YouTube or Spotify for rap artists?",
    answer:
      "Hiffi is built exclusively for hip-hop and music video creators — not a general video or audio platform. Your content reaches an audience that is specifically looking for rap and hip-hop. Discovery is genre-native, creator tools are designed for independent artists, and fans come for official music videos and emerging rapper uploads in one culture-first feed.",
  },
  {
    question: "What hip-hop subgenres are on Hiffi?",
    answer:
      "Hiffi supports the full range of hip-hop subgenres: drill, trap, conscious rap, boom bap, lo-fi hip-hop, melodic rap, rage rap, and spiritual/legacy rap. Each mood has its own discovery section so fans can find exactly the vibe they want — from underground rap streaming to melodic trap and boom bap playlists.",
  },
  {
    question: "Can underground rappers upload music videos to Hiffi?",
    answer:
      "Absolutely. Hiffi is designed for independent and underground rap artists. Apply through the Become a Creator flow, upload your official music videos, and start building your audience directly — no label or distributor required. Underground hip-hop uploads sit alongside established independents in a rap-first catalog.",
  },
  {
    question: "Is Hiffi free to use?",
    answer:
      "Yes. Hiffi is free for fans to browse, discover, and watch content. The app is also free to download on iOS and Android. Creators apply to publish and upload videos through the platform.",
  },
]

const hubJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageTitle,
      description: pageDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${getSiteOrigin()}/#website` },
      about: { "@id": `${getSiteOrigin()}/#organization` },
      mainEntity: { "@id": `${pageUrl}#faq` },
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: pageUrl,
      name: "Hip-Hop FAQ — Hiffi",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#mood-list`,
      name: "Hip-Hop Mood Playlists on Hiffi",
      description: "Discover hip-hop by mood — drill, trap, conscious rap, boom bap, lo-fi, and more on Hiffi.",
      numberOfItems: MOODS.length,
      itemListElement: MOODS.map((mood, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(moodPath(mood.query)),
        name: `${mood.label} — ${mood.vibe}`,
      })),
    },
  ],
}

const ARTISTS_HREF = "/artist-index/city/atlanta"
const ARTIST_INDEX_HREF = "/artist-index"
const APP_HREF = "/app"
const ALL_VIBES_HREF = "/"
const FAQ_HREF = "/faq"
const HERO_IMAGE = "/hip-hop/hero-artist.webp"

function moodPath(query: string) {
  return `/hip-hop/mood/${encodeURIComponent(query.replace(/\s+/g, "-").toLowerCase())}`
}

function searchPath(term: string) {
  return `/search?q=${encodeURIComponent(term.toLowerCase())}`
}

const moodIcons: Record<string, LucideIcon> = {
  "on sight": Zap,
  "soul search": AudioWaveform,
  "money talk": Crown,
  "blue hours": Moon,
  "low rider": Disc3,
  "turn up": Activity,
  "god's plan": Star,
}

const vibeCards: Array<{ title: string; description: string; href: string; icon: LucideIcon }> = [
  ...MOODS.map((mood) => ({
    title: mood.label,
    description: mood.vibe,
    href: moodPath(mood.query),
    icon: moodIcons[mood.query] ?? Disc3,
  })),
  // No mood hub exists for underground rap, so this card opens search like the subgenre pills.
  { title: "Underground", description: "Raw talent, new sounds", href: searchPath("underground rap"), icon: Compass },
]

const features: Array<{ title: string; description: string; icon: LucideIcon }> = [
  {
    title: "Hip-Hop First Audience",
    description: "A real audience that lives and breathes hip-hop culture.",
    icon: Users,
  },
  {
    title: "Official Music Videos",
    description: "Upload music videos and keep your content organized.",
    icon: CirclePlay,
  },
  {
    title: "Creator Control",
    description: "Manage your profile and content while retaining creative ownership.",
    icon: SlidersVertical,
  },
  {
    title: "Discoverability",
    description: "Genre-based discovery helps fans explore artists and music.",
    icon: ChartColumn,
  },
]

const subgenres = [
  "Drill",
  "Trap",
  "Conscious Rap",
  "Boom Bap",
  "Lo-fi Hip-Hop",
  "Rage Rap",
  "Melodic Rap",
  "Underground Rap",
  "Lyrical Rap",
  "East Coast Rap",
  "West Coast Rap",
  "Southern Hip-Hop",
  "UK Drill",
  "Afro Trap",
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
const darkFocusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050506]"
const buttonBase =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-sm font-semibold transition-colors"
const primaryButton = cn(
  buttonBase,
  "bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] hover:bg-primary/90",
)
const darkSecondaryButton = cn(
  buttonBase,
  "border border-white/10 bg-white/[0.08] text-white hover:border-white/25 hover:bg-white/15",
  darkFocusRing,
)
const lightSecondaryButton = cn(
  buttonBase,
  "border border-border bg-background text-foreground hover:border-primary/40 hover:text-primary",
  focusRing,
)
const sideLink = cn(
  "inline-flex items-center gap-1 whitespace-nowrap rounded text-xs font-semibold text-primary hover:underline",
  focusRing,
)
const iconTile =
  "flex shrink-0 items-center justify-center rounded-lg bg-rose-50 text-primary dark:bg-primary/15"

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

/** Night skyline buildings: [x, width, height, roof] on a 480×270 canvas, ground line at y=200. */
const NIGHT_SKYLINE: Array<[number, number, number, "flat" | "peak" | "spire"]> = [
  [0, 28, 52, "flat"],
  [34, 22, 78, "flat"],
  [62, 34, 120, "peak"],
  [102, 24, 66, "flat"],
  [132, 38, 96, "flat"],
  [176, 26, 150, "spire"],
  [208, 36, 128, "peak"],
  [250, 22, 84, "flat"],
  [278, 32, 110, "flat"],
  [316, 26, 160, "spire"],
  [348, 34, 92, "flat"],
  [388, 24, 70, "flat"],
  [418, 30, 104, "peak"],
  [454, 26, 58, "flat"],
]

function AtlantaNightScene() {
  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="hip-hop-atl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0b0507" />
          <stop offset="0.65" stopColor="#2a070c" />
          <stop offset="1" stopColor="#4a0b12" />
        </linearGradient>
        <radialGradient id="hip-hop-atl-glow" cx="0.55" cy="0.72" r="0.6">
          <stop offset="0" stopColor="#ED1C2F" stopOpacity="0.5" />
          <stop offset="1" stopColor="#ED1C2F" stopOpacity="0" />
        </radialGradient>
        <pattern id="hip-hop-atl-windows" width="6" height="8" patternUnits="userSpaceOnUse">
          <rect x="1.5" y="2" width="2" height="3" fill="#ffd9a8" />
        </pattern>
      </defs>
      <rect width="480" height="270" fill="url(#hip-hop-atl-sky)" />
      <rect width="480" height="270" fill="url(#hip-hop-atl-glow)" />
      {/* Distant towers, offset from the foreground row for depth */}
      <g fill="#3a0c13" opacity="0.7">
        {NIGHT_SKYLINE.map(([x, w, h]) => (
          <rect key={x} x={x + w * 0.6} y={200 - h * 1.15} width={w * 0.8} height={h * 1.15} />
        ))}
      </g>
      {NIGHT_SKYLINE.map(([x, w, h, roof], i) => {
        const top = 200 - h
        return (
          <g key={x}>
            <g fill="#14070a">
              <rect x={x} y={top} width={w} height={h} />
              {roof === "peak" ? <polygon points={`${x},${top} ${x + w / 2},${top - 14} ${x + w},${top}`} /> : null}
              {roof === "spire" ? <rect x={x + w / 2 - 1} y={top - 20} width={2} height={20} /> : null}
            </g>
            <rect
              x={x + 2}
              y={top + 4}
              width={w - 4}
              height={h - 8}
              fill="url(#hip-hop-atl-windows)"
              opacity={[0.22, 0.4, 0.12, 0.3][i % 4]}
            />
          </g>
        )
      })}
      <rect y="200" width="480" height="70" fill="#0d0507" />
      {/* Highway light trails */}
      <path d="M-20 272 C 140 236, 260 214, 500 204" fill="none" stroke="#ff3b4a" strokeWidth="3" opacity="0.8" />
      <path d="M-20 262 C 130 230, 250 211, 500 201" fill="none" stroke="#ffe0c2" strokeWidth="1.5" opacity="0.55" />
      <path d="M-20 282 C 150 244, 270 220, 500 208" fill="none" stroke="#ED1C2F" strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

function VinylArtwork() {
  return (
    <div
      className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-[#fdf2f3] dark:border-primary/20 dark:from-primary/10 dark:to-background"
      aria-hidden
    >
      <Crown className="absolute left-[8%] top-[9%] h-8 w-8 text-primary sm:h-9 sm:w-9" strokeWidth={2.25} />
      <div className="relative aspect-square w-[60%] max-w-[300px] rounded-full bg-[repeating-radial-gradient(circle,#111113_0px,#111113_3px,#1d1d21_4px,#111113_5px)] shadow-[0_28px_48px_-20px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,transparent_0deg,rgba(255,255,255,0.09)_35deg,transparent_80deg,transparent_180deg,rgba(255,255,255,0.06)_215deg,transparent_260deg)]" />
        <div className="absolute inset-[6%] rounded-full ring-1 ring-white/5" />
        <div className="absolute inset-[18%] rounded-full ring-1 ring-white/5" />
        <div className="absolute inset-[33%] flex items-center justify-center rounded-full bg-primary">
          <div className="h-[22%] w-[22%] rounded-full bg-white" />
        </div>
      </div>
    </div>
  )
}

function FaqAccordion() {
  return (
    <div className="mt-6 border-t border-border">
      {faqItems.map((item) => (
        <details key={item.question} className="group border-b border-border">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 text-sm font-semibold text-foreground transition-colors hover:text-primary [&::-webkit-details-marker]:hidden",
              focusRing,
            )}
          >
            {item.question}
            <Plus
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 group-open:text-primary"
              aria-hidden
            />
          </summary>
          <p className="max-w-3xl pb-5 pr-8 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}

export default function HipHopPage() {
  return (
    <div className="overflow-x-clip bg-background">
      <JsonLd data={hubJsonLd} />

      {/* Hero */}
      <section aria-labelledby="hip-hop-hero-heading" className="relative isolate overflow-hidden bg-[#050506] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#050506_45%,#1f0508_78%,#450a11_100%)]"
          aria-hidden
        />
        <div
          className={cn(
            container,
            "grid items-center gap-12 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16 lg:py-20",
          )}
        >
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Music</p>
            <h1
              id="hip-hop-hero-heading"
              className="mt-4 text-[2.25rem] font-bold uppercase leading-[0.98] tracking-tight sm:text-5xl lg:text-[3.6rem]"
            >
              <span className="block">Hip-Hop Music</span>
              <span className="block text-primary">Videos &amp; Streaming</span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75">{pageDescription}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={ARTISTS_HREF} className={cn(primaryButton, darkFocusRing)}>
                Discover Artists
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <CreatorDestinationLink className={darkSecondaryButton}>Upload Your Music</CreatorDestinationLink>
              <Link href={APP_HREF} className={darkSecondaryButton}>
                Get the App
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[420px] pt-5 lg:mr-0">
            <Crown
              className="absolute left-8 top-0 z-10 h-10 w-10 -translate-y-1/4 text-primary drop-shadow-[0_0_12px_rgba(237,28,47,0.6)]"
              strokeWidth={2.25}
              aria-hidden
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0f] shadow-[0_30px_60px_-30px_rgba(237,28,47,0.5)] sm:aspect-square">
              <Image
                src={HERO_IMAGE}
                alt="Hip-hop artist performing live on stage with a microphone"
                fill
                priority
                sizes="(min-width: 640px) 420px, 100vw"
                className="object-cover object-[40%_center]"
              />
              <div className="absolute inset-0 bg-gradient-to-bl from-black/70 via-black/10 to-black/40" aria-hidden />
              <p className="absolute right-5 top-5 text-right text-xl font-black uppercase italic leading-[1.1] tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:right-6 sm:top-6 sm:text-2xl">
                <span className="block text-white">Real Artists</span>
                <span className="block text-primary">Real Culture</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 01 Browse by vibe */}
      <section aria-labelledby="hip-hop-vibes-heading" className={cn(container, "py-14 sm:py-16")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel number="01">Browse by vibe</SectionLabel>
            <SectionHeading id="hip-hop-vibes-heading">Explore Hip-Hop Vibes</SectionHeading>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Hip-hop-native moods — culture-first vibe hubs for drill, trap, conscious rap, and more.
            </p>
          </div>
          <Link href={ALL_VIBES_HREF} className={sideLink}>
            View all vibes
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {vibeCards.map(({ title, description, href, icon: Icon }) => (
            <li key={title}>
              <Link
                href={href}
                className={cn(
                  "group flex h-full min-h-[148px] flex-col rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 sm:p-5",
                  focusRing,
                )}
              >
                <span className={cn(iconTile, "h-8 w-8")} aria-hidden>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="mt-4 text-sm font-semibold text-foreground group-hover:text-primary">{title}</span>
                <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</span>
                <span
                  className="mt-auto flex h-6 w-6 items-center justify-center self-end rounded-full bg-rose-50 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground dark:bg-primary/15"
                  aria-hidden
                >
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 02 Atlanta artists */}
      <section aria-labelledby="hip-hop-atlanta-heading" className="border-y border-border bg-[#fafafa] dark:bg-muted/40">
        <div
          className={cn(
            container,
            "grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16",
          )}
        >
          <div>
            <SectionLabel number="02">Discover</SectionLabel>
            <SectionHeading id="hip-hop-atlanta-heading">Atlanta Hip-Hop Artists</SectionHeading>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Browse 800+ emerging Atlanta rap and hip-hop profiles on the Hiffi Artist Index — claimable listings
              with official links, genre tags, and paths to music videos on Hiffi.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={ARTISTS_HREF} className={cn(primaryButton, focusRing)}>
                Browse 800+ Atlanta artists
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={ARTIST_INDEX_HREF} className={lightSecondaryButton}>
                Full Artist Index
              </Link>
            </div>
          </div>

          <div
            className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0b0507] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.7)]"
            aria-hidden
          >
            <AtlantaNightScene />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 right-5 text-right sm:bottom-7 sm:right-7">
              <p className="text-2xl font-black uppercase leading-[1.05] tracking-tight text-white sm:text-3xl">
                Atlanta
                <br />
                Artists
              </p>
              <p className="mt-2 text-[11px] font-medium text-white/80 sm:text-xs">Artists. Music. Culture.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 Why Hiffi */}
      <section aria-labelledby="hip-hop-why-heading" className={cn(container, "py-14 sm:py-16")}>
        <SectionLabel number="03">Why Hiffi</SectionLabel>
        <SectionHeading id="hip-hop-why-heading">Why Hip-Hop Artists Choose Hiffi</SectionHeading>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Hip-hop accounts for a large share of global music streaming, but many platforms are built for everyone.
          Hiffi puts hip-hop culture and independent artists at the center.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {features.map(({ title, description, icon: Icon }) => (
            <li key={title} className="rounded-xl border border-border bg-background p-5 sm:p-6">
              <span className={cn(iconTile, "h-10 w-10")} aria-hidden>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-5 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 04 Subgenres */}
      <section
        id="hip-hop-subgenres"
        aria-labelledby="hip-hop-subgenres-heading"
        className="scroll-mt-20 border-y border-border bg-[#fafafa] dark:bg-muted/40"
      >
        <div
          className={cn(
            container,
            "grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16",
          )}
        >
          <div>
            <SectionLabel number="04">Hip-hop subgenres</SectionLabel>
            <SectionHeading id="hip-hop-subgenres-heading">Explore Hip-Hop Subgenres on Hiffi</SectionHeading>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Discover independent artists, official music videos, and new releases across every style.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {subgenres.map((genre) => (
                <li key={genre}>
                  <Link
                    href={searchPath(genre)}
                    className={cn(
                      "inline-flex rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary",
                      focusRing,
                    )}
                  >
                    {genre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mx-auto w-full max-w-[460px] lg:mr-0">
            <VinylArtwork />
          </div>
        </div>
      </section>

      {/* 05 FAQ */}
      <section aria-labelledby="hip-hop-faq-heading" className={cn(container, "py-14 sm:py-16")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionLabel number="05">Frequently asked questions</SectionLabel>
            <SectionHeading id="hip-hop-faq-heading">FAQ</SectionHeading>
          </div>
          <Link href={FAQ_HREF} className={sideLink}>
            View all FAQs
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <FaqAccordion />
      </section>

      {/* CTA */}
      <section
        id="hip-hop-cta"
        aria-labelledby="hip-hop-cta-heading"
        className="relative isolate scroll-mt-20 overflow-hidden bg-[#050506] text-white"
      >
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_120%_at_50%_100%,rgba(237,28,47,0.35)_0%,rgba(237,28,47,0.08)_45%,transparent_75%)]"
          aria-hidden
        />
        <div className={cn(container, "flex flex-col gap-7 py-12 sm:py-14 md:flex-row md:items-center md:justify-between")}>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Ready to drop your next video?
            </p>
            <h2 id="hip-hop-cta-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Join <span className="text-primary">Independent</span> Hip-Hop Artists
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Upload your official music videos and start building your audience today.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <CreatorDestinationLink className={cn(primaryButton, darkFocusRing)}>
              Become a creator
              <ArrowRight className="h-4 w-4" aria-hidden />
            </CreatorDestinationLink>
            <Link href={APP_HREF} className={darkSecondaryButton}>
              Download App
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
