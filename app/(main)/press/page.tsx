import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Camera,
  Crown,
  Download,
  Globe,
  Handshake,
  Mail,
  Megaphone,
  Music,
  ShieldCheck,
  Smartphone,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"
import { CopyBoilerplateButton } from "./copy-boilerplate-button"

const PAGE_PATH = "/press"
const PAGE_TITLE = "Press Kit"
const HERO_DESCRIPTION =
  "Resources for journalists, podcasters, and partners covering Hiffi — the artist-first hip-hop streaming platform at hiffi.com."
const BOILERPLATE =
  "Hiffi is the artist-first streaming platform built for hip-hop. Independent rappers, producers, and DJs share music videos and connect with fans who came specifically for the culture — on web and mobile at hiffi.com."

const PRESS_EMAIL = "care@hiffi.com"
const PRESS_MAILTO = `mailto:${PRESS_EMAIL}?subject=Press%20Inquiry`
const BRAND_GUIDELINES_PDF = "/documents/hiffi-brand-guidelines.pdf"
const FOUNDER_PHOTO = "/inoto-kinimi-founder-photo.jpg"

/**
 * Complete press kit bundle. No ZIP exists yet — set `{ href, size }` once one is
 * published to `/public` and the hero button switches to a direct download.
 */
const PRESS_KIT_ZIP: { href: string; size: string } | null = null

type Item = { title: string; description: string; icon: LucideIcon }

const heroHighlights: Item[] = [
  { title: "Official assets", description: "Logos, wordmark, brand kit", icon: ShieldCheck },
  { title: "Verified info", description: "About, boilerplate, FAQs", icon: BadgeCheck },
  { title: "High-res media", description: "Founder photo, assets", icon: Camera },
]

// File sizes match the files in /public.
type BrandAsset = {
  title: string
  description: string
  meta: string
  href: string
  download?: string
  actionLabel: string
  preview: ReactNode
}

const brandAssets: BrandAsset[] = [
  {
    title: "Logo (PNG)",
    description: "High-resolution Hiffi H mark with transparent background.",
    meta: "PNG · 1.1 MB",
    href: "/hiffi_logo.png",
    download: "hiffi-logo.png",
    actionLabel: "Download Hiffi logo (PNG, 1.1 MB)",
    preview: (
      <div className="relative h-14 w-11">
        <Image src="/hiffi_logo.png" alt="Hiffi H mark" fill sizes="44px" className="object-contain" />
      </div>
    ),
  },
  {
    title: "App bar logo",
    description: "Full HIFFI wordmark as used in the Hiffi app bar and site header.",
    meta: "PNG · 5 KB",
    href: "/appbarlogo.png",
    download: "hiffi-app-bar-logo.png",
    actionLabel: "Download Hiffi app bar logo (PNG, 5 KB)",
    preview: (
      <Image src="/appbarlogo.png" alt="HIFFI wordmark" width={975} height={305} className="h-auto w-32" />
    ),
  },
  {
    title: "Brand guidelines (PDF)",
    description: "Logo usage, colour, typography, patterns and misuse rules.",
    meta: "PDF · 10.1 MB",
    href: BRAND_GUIDELINES_PDF,
    download: "hiffi-brand-guidelines.pdf",
    actionLabel: "Download Hiffi brand guidelines (PDF, 10.1 MB)",
    preview: (
      <div className="flex flex-col items-center gap-2">
        <Image src="/appbarlogo.png" alt="" width={975} height={305} className="h-auto w-16" />
        <span className="text-sm font-semibold text-white">Brand Guidelines</span>
      </div>
    ),
  },
  {
    title: "Typography",
    description: "Archivo Black for display, Inter for body, plus Barlow Condensed and JetBrains Mono.",
    meta: "PDF · Page 11",
    href: `${BRAND_GUIDELINES_PDF}#page=11`,
    actionLabel: "Open the typography page of the brand guidelines (PDF, page 11)",
    preview: (
      <div className="text-center">
        <span className="block text-4xl font-black leading-none text-primary" aria-hidden>
          Aa
        </span>
        <span className="mt-2 block text-sm font-semibold text-foreground">Archivo Black · Inter</span>
      </div>
    ),
  },
]

const contactRows: { label: string; icon: LucideIcon; content: ReactNode }[] = [
  {
    label: "Email",
    icon: Mail,
    content: (
      <>
        <a href={PRESS_MAILTO} className="font-medium text-primary hover:underline">
          {PRESS_EMAIL}
        </a>
        <span className="block text-xs text-muted-foreground">(subject: Press Inquiry)</span>
      </>
    ),
  },
  {
    label: "Brand partnerships",
    icon: Handshake,
    content: (
      <Link href="/collaborate" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        Brand collaboration form
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    ),
  },
  {
    label: "Advertising",
    icon: Megaphone,
    content: (
      <Link href="/advertising" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
        Hiffi Advertising
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    ),
  },
]

const quickFacts: { label: string; icon: LucideIcon; content: ReactNode }[] = [
  {
    label: "Website",
    icon: Globe,
    content: (
      <Link href="/" className="text-primary hover:underline">
        hiffi.com
      </Link>
    ),
  },
  {
    label: "Apps",
    icon: Smartphone,
    content: (
      <Link href="/app" className="hover:text-primary hover:underline">
        iOS and Android
      </Link>
    ),
  },
  { label: "Focus", icon: Music, content: "Hip-hop, rap, & independent music video culture" },
  { label: "Operator", icon: Building2, content: "Kinimi Corporation" },
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
const primaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] transition-colors hover:bg-primary/90",
  focusRing,
)
const darkSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/15",
  focusRing,
)
const whiteCard =
  "rounded-2xl border border-black/[0.05] bg-card shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] dark:border-white/10"
const softCard = "rounded-2xl bg-[#f6f2f1] dark:bg-muted/40"

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-2.5">
      <span className="text-2xl font-bold leading-none text-primary" aria-hidden>
        {number}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{children}</span>
    </p>
  )
}

function IconCircle({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-primary dark:bg-primary/15"
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

export default function PressPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
    primaryImage: "/press/hero-artist.jpg",
  })

  return (
    <div className="overflow-x-clip bg-[#fbf8f7] dark:bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section aria-labelledby="press-hero-heading" className="relative isolate overflow-hidden bg-[#1d1c1e] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_0%_0%,rgba(237,28,47,0.22),transparent_45%),radial-gradient(ellipse_at_95%_60%,rgba(237,28,47,0.14),transparent_50%)]"
          aria-hidden
        />

        <div
          className={cn(
            container,
            "grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 lg:py-12",
          )}
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-10 lg:mb-12">
              <ol className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
                <li>
                  <Link href="/" className="rounded transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li aria-current="page" className="font-medium text-white/90">{PAGE_TITLE}</li>
              </ol>
            </nav>

            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Media</p>
            <h1 id="press-hero-heading" className="mt-3 text-5xl font-bold tracking-tight sm:text-6xl">
              Press <span className="text-primary">Kit</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/75">{HERO_DESCRIPTION}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {PRESS_KIT_ZIP ? (
                <a href={PRESS_KIT_ZIP.href} download className={primaryButton}>
                  <Download className="h-4 w-4" aria-hidden />
                  Download complete press kit (ZIP · {PRESS_KIT_ZIP.size})
                </a>
              ) : (
                <a href="#brand-assets" className={primaryButton}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                  Get press assets
                </a>
              )}
              <a href={PRESS_MAILTO} className={darkSecondaryButton}>
                <Mail className="h-4 w-4" aria-hidden />
                Media inquiries
              </a>
            </div>

            <ul className="mt-9 grid max-w-[34rem] gap-4 rounded-xl bg-white/[0.05] p-4 ring-1 ring-white/[0.06] sm:grid-cols-3 sm:p-5">
              {heroHighlights.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                    aria-hidden
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{title}</span>
                    <span className="block text-xs leading-snug text-white/50">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[460px] lg:mr-0">
            <div className="absolute -inset-6 -z-10 rounded-full bg-primary/15 blur-3xl" aria-hidden />
            <div className="relative aspect-square overflow-hidden rounded-[1.25rem] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
              <Image
                src="/press/hero-artist.jpg"
                alt="A hip-hop artist in a cap rapping into a microphone under red and gold stage light"
                fill
                priority
                sizes="(min-width: 1024px) 460px, (min-width: 640px) 460px, 100vw"
                className="object-cover object-[35%_center]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/30"
                aria-hidden
              />
              <Crown className="absolute left-5 top-5 h-7 w-7 fill-primary text-primary sm:left-6 sm:top-6" aria-hidden />
              <p
                className="absolute right-5 top-5 text-right text-xl font-black uppercase leading-[1.05] tracking-[0.08em] [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] sm:right-6 sm:top-6 sm:text-2xl"
                aria-hidden
              >
                <span className="block text-primary">Music</span>
                <span className="block text-primary">Culture</span>
                <span className="block text-primary">People</span>
                <span className="block text-white">Stories</span>
              </p>
              <p className="absolute bottom-5 left-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85 sm:bottom-6 sm:left-6">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                Artist-first hip-hop infrastructure
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 01 Company overview */}
      <section aria-labelledby="overview-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <div className="grid items-center gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <SectionLabel number="01">Company overview</SectionLabel>
            <h2 id="overview-heading" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              About Hiffi
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Hiffi is a hip-hop-first music and video streaming platform where independent artists publish official
              music videos and fans discover rap culture without algorithmic gatekeeping. Hiffi is operated by{" "}
              <strong className="font-semibold text-foreground">Kinimi Corporation</strong>.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-primary">
              <Link href="/what-is-hiffi" className="inline-flex items-center gap-1 rounded hover:underline">
                What is Hiffi?
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link href="/about" className="inline-flex items-center gap-1 rounded hover:underline">
                About Hiffi
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#1d1c1e] shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]">
            <Image
              src="/press/about-stage.jpg"
              alt="A hip-hop artist on stage pointing out to a packed crowd"
              fill
              sizes="(min-width: 1024px) 460px, (min-width: 768px) 50vw, 100vw"
              className="object-cover object-[60%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" aria-hidden />
            <div className="absolute bottom-5 left-5 sm:bottom-6 sm:left-6">
              <span className="block h-0.5 w-6 bg-primary" aria-hidden />
              <p className="mt-3 text-sm font-semibold leading-snug text-white sm:text-base">
                Live culture.
                <br />
                Independent artists.
                <br />
                Real stories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 Boilerplate */}
      <section aria-labelledby="boilerplate-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          <div>
            <SectionLabel number="02">Boilerplate</SectionLabel>
            <h2 id="boilerplate-heading" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              Press paragraph
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">{BOILERPLATE}</p>
          </div>

          <figure className={cn(softCard, "p-6 sm:p-7")}>
            <span className="block font-serif text-4xl leading-none text-primary" aria-hidden>
              &ldquo;
            </span>
            <blockquote className="mt-1 text-[15px] italic leading-relaxed text-foreground/85">{BOILERPLATE}</blockquote>
            <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Standard company boilerplate
              </span>
              <CopyBoilerplateButton text={BOILERPLATE} />
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 03 Brand assets */}
      <section id="brand-assets" aria-labelledby="assets-heading" className={cn(container, "scroll-mt-20 pt-14 sm:pt-16")}>
        <SectionLabel number="03">Brand assets</SectionLabel>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="assets-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
              Logos, guidelines and more
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Download official brand assets, logos, and usage guidelines.
            </p>
          </div>
          <a
            href={BRAND_GUIDELINES_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded text-sm font-semibold text-primary hover:underline"
          >
            View usage guidelines
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">(opens PDF in a new tab)</span>
          </a>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {brandAssets.map((asset, index) => {
            const opensInTab = !asset.download
            return (
              <li key={asset.title} className={cn(whiteCard, "flex flex-col p-3")}>
                <div
                  className={cn(
                    "flex h-36 items-center justify-center rounded-xl",
                    index === 2 ? "bg-[#1d1c1e]" : "bg-[#f6f2f1] dark:bg-muted/40",
                  )}
                >
                  {asset.preview}
                </div>
                <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
                  <h3 className="text-[15px] font-semibold text-foreground">{asset.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{asset.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-5">
                    <span className="text-[11px] font-medium text-muted-foreground">{asset.meta}</span>
                    <a
                      href={asset.href}
                      {...(opensInTab
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : { download: asset.download })}
                      aria-label={asset.actionLabel}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f2f1] text-primary transition-colors hover:bg-primary hover:text-primary-foreground dark:bg-muted",
                        focusRing,
                      )}
                    >
                      {opensInTab ? (
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden />
                      )}
                    </a>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 04 Founder */}
      <section aria-labelledby="founder-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <SectionLabel number="04">Founder</SectionLabel>
        <div className={cn(whiteCard, "mt-5 grid gap-6 p-5 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center sm:gap-8 sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10")}>
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[260px] overflow-hidden rounded-xl bg-muted shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45)] sm:max-w-none">
            <Image
              src={FOUNDER_PHOTO}
              alt="Inoto Kinimi, Founder of Hiffi"
              fill
              sizes="(min-width: 1024px) 220px, (min-width: 640px) 200px, 260px"
              className="object-cover object-top"
            />
          </div>
          <div className="min-w-0">
            <h2 id="founder-heading" className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Inoto Kinimi
            </h2>
            <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Founder</p>
            <blockquote className={cn(softCard, "mt-5 rounded-xl px-5 py-4 text-sm italic leading-relaxed text-foreground/85")}>
              &ldquo;Talent is everywhere. Opportunity should be too.&rdquo;
            </blockquote>
            <div className="mt-5 flex flex-col items-start gap-3 lg:flex-row lg:items-center">
              <a href={FOUNDER_PHOTO} download="inoto-kinimi-founder-photo.jpg" className={primaryButton}>
                <Download className="h-4 w-4" aria-hidden />
                Download founder photo (JPG)
              </a>
              <span className="text-xs text-muted-foreground">High-resolution for press use</span>
            </div>
          </div>
        </div>
      </section>

      {/* 05 Media contact + 06 Quick facts */}
      <div className={cn(container, "grid gap-5 pt-14 sm:pt-16 md:grid-cols-2")}>
        <section aria-labelledby="contact-heading" className={cn(whiteCard, "p-6 sm:p-7")}>
          <SectionLabel number="05">Media contact</SectionLabel>
          <h2 id="contact-heading" className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            Get in touch
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">For press inquiries, interviews, and partnership requests:</p>
          <ul className="mt-6 space-y-4">
            {contactRows.map(({ label, icon, content }) => (
              <li key={label} className="flex items-start gap-3">
                <IconCircle icon={icon} />
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-foreground">{label}</p>
                  <div className="mt-0.5">{content}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="facts-heading" className={cn(whiteCard, "p-6 sm:p-7")}>
          <SectionLabel number="06">Quick facts</SectionLabel>
          <h2 id="facts-heading" className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            At a glance
          </h2>
          <dl className="mt-6 grid gap-3 min-[400px]:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {quickFacts.map(({ label, icon, content }) => (
              <div key={label} className={cn(softCard, "flex items-start gap-3 rounded-xl p-4")}>
                <IconCircle icon={icon} />
                <div className="min-w-0 text-sm">
                  <dt className="font-semibold text-foreground">{label}</dt>
                  <dd className="mt-0.5 leading-snug text-muted-foreground">{content}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Final CTA */}
      <div className={cn(container, "pb-14 pt-14 sm:pb-20 sm:pt-16")}>
        <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden rounded-3xl bg-[#1d1c1e] text-white">
          <Image
            src="/press/cta-crowd.jpg"
            alt=""
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="-z-20 object-cover object-[75%_center] opacity-60"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1d1c1e] via-[#1d1c1e]/90 to-[#1d1c1e]/40"
            aria-hidden
          />
          <div className="flex flex-col gap-7 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Be part of the culture</p>
              <h2 id="cta-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to get started?
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                Join the Hiffi community — whether you&apos;re creating or discovering hip-hop culture.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <a href={PRESS_MAILTO} className={primaryButton}>
                Email press inquiries
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link href="/collaborate" className={darkSecondaryButton}>
                Brand collaboration
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
