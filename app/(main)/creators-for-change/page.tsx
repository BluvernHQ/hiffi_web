import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  ChevronRight,
  CircleCheck,
  FileText,
  Handshake,
  Headphones,
  Heart,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  UserPlus,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

const PAGE_PATH = "/creators-for-change"
const PAGE_TITLE = "Creators for Change"
const HERO_DESCRIPTION =
  "Supporting independent hip-hop artists and community leaders who use music to mentor, educate, and create positive cultural impact."

const APPLY_HREF = "/creator/apply"
const NOMINATE_HREF = "mailto:care@hiffi.com?subject=Creators%20for%20Change%20Nomination"
const PARTNER_HREF = "/collaborate"

type Item = { title: string; description: string; icon: LucideIcon }

const heroHighlights: Item[] = [
  { title: "Real artists", description: "Built for hip-hop", icon: Headphones },
  { title: "Community impact", description: "Music beyond streams", icon: TrendingUp },
  { title: "Safe & transparent", description: "Verified programs", icon: ShieldCheck },
]

const participation: (Item & { href: string; external?: boolean; cta: string })[] = [
  {
    title: "Apply as a Hiffi creator",
    description: "Publish content that reflects your community work, workshops, fundraisers, or educational series.",
    icon: UserPlus,
    href: APPLY_HREF,
    cta: "Apply as a creator",
  },
  {
    title: "Nominate a creator",
    description: "Email us with their Hiffi profile and a short description of their impact.",
    icon: Star,
    href: NOMINATE_HREF,
    external: true,
    cta: "Email a nomination",
  },
  {
    title: "Partner with us",
    description: "Join initiatives that connect brands, nonprofits, and artists around shared goals in hip-hop culture.",
    icon: Handshake,
    href: PARTNER_HREF,
    cta: "Open the brand collaboration form",
  },
]

const criteria: Item[] = [
  { title: "Authentic impact", description: "Meaningful community engagement over follower counts.", icon: Heart },
  { title: "Original content", description: "Consistent, original work that educates or empowers.", icon: FileText },
  { title: "Respect & safety", description: "Respect for artists, fans, and platform guidelines.", icon: ShieldCheck },
  { title: "Mission aligned", description: "Work that aligns with Hiffi’s artist-first mission.", icon: Target },
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
const primaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] transition-colors hover:bg-primary/90",
  focusRing,
)
const darkSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-black/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10",
  focusRing,
)
const lightSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-black/10 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted dark:border-white/15",
  focusRing,
)
const inlineLink = "font-semibold text-primary hover:underline"
const iconTile = "flex items-center justify-center rounded-lg bg-rose-50 text-primary dark:bg-primary/15"

function SectionTitle({
  number,
  eyebrow,
  id,
  children,
}: {
  number: string
  eyebrow: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="flex items-end gap-3 sm:gap-4">
      <span className="text-4xl font-bold leading-[0.85] tracking-tight text-primary sm:text-[2.75rem]" aria-hidden>
        {number}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:text-[11px]">{eyebrow}</p>
        <h2 id={id} className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
          {children}
        </h2>
      </div>
    </div>
  )
}

function ImageCaptionCard({
  src,
  alt,
  sizes,
  imageClassName,
  children,
}: {
  src: string
  alt: string
  sizes: string
  imageClassName?: string
  children: ReactNode
}) {
  return (
    <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-[#0b0b0f] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.7)]">
      <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-primary/10" aria-hidden />
      <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8">
        <p className="text-lg font-bold leading-snug text-white sm:text-xl">{children}</p>
        <span className="mt-3 block h-[3px] w-9 bg-primary" aria-hidden />
      </div>
    </div>
  )
}

export default function CreatorsForChangePage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
  })

  return (
    <div className="overflow-x-clip bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section aria-labelledby="cfc-hero-heading" className="relative isolate overflow-hidden bg-[#0b0b0f] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(237,28,47,0.45),transparent_55%),radial-gradient(ellipse_at_45%_20%,rgba(237,28,47,0.18),transparent_40%)]"
          aria-hidden
        />

        <div
          className={cn(
            container,
            "grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14 lg:py-12",
          )}
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-10 lg:mb-14">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
                <li>
                  <Link href="/" className="rounded transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>Community</li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li aria-current="page" className="font-medium text-white/90">
                  {PAGE_TITLE}
                </li>
              </ol>
            </nav>

            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Community</p>
            <h1 id="cfc-hero-heading" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Creators for <span className="text-primary">Change</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/75 sm:text-base">{HERO_DESCRIPTION}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={APPLY_HREF} className={primaryButton}>
                Apply as a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href={NOMINATE_HREF} className={darkSecondaryButton}>
                Nominate a creator
              </a>
            </div>

            <ul className="mt-10 grid max-w-2xl gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              {heroHighlights.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs leading-snug">
                    <span className="block font-semibold text-white">{title}</span>
                    <span className="block text-white/55">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[460px] lg:mr-0">
            <div className="absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-3xl" aria-hidden />
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.25rem] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
              <Image
                src="/creators-for-change/hero-artist.jpg"
                alt="A smiling hip-hop artist performing into a microphone on stage"
                fill
                priority
                sizes="(min-width: 1024px) 460px, 100vw"
                className="object-cover object-[center_30%]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-primary/30 mix-blend-multiply"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-[10px] sm:inset-x-5">
                <span className="font-bold uppercase tracking-[0.2em] text-primary">Hiffi Spotlight</span>
                <span className="text-white/75">Community Session #12</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 01 About */}
      <section aria-labelledby="about-heading" className={cn(container, "py-16 sm:py-20")}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionTitle number="01" eyebrow="About" id="about-heading">
              What is Creators for Change?
            </SectionTitle>
            <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Hip-hop has always been more than music. It is a platform for storytelling, education, activism,
                mentorship, and community. Hiffi&apos;s Creators for Change program recognizes artists whose work
                creates a positive impact both online and offline.
              </p>
              <p>
                We amplify these creators through featured placement, program partnerships, and platform resources —
                without asking them to compromise their authenticity for algorithms.
              </p>
            </div>
          </div>

          <ImageCaptionCard
            src="/mail-assets/bring_videos_crowd_banner.png"
            alt="A hip-hop concert crowd with hands raised under red stage lights"
            sizes="(min-width: 1024px) 480px, 100vw"
            imageClassName="object-[center_40%]"
          >
            A platform for artists who
            <br className="hidden sm:inline" /> create change.
          </ImageCaptionCard>
        </div>
      </section>

      {/* 02 How creators participate */}
      <section
        aria-labelledby="participate-heading"
        className="border-y border-rose-100/70 bg-[#fdf7f7] py-16 dark:border-white/5 dark:bg-muted/30 sm:py-20"
      >
        <div className={container}>
          <SectionTitle number="02" eyebrow="How creators participate" id="participate-heading">
            Get involved in different ways
          </SectionTitle>

          <ul className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {participation.map(({ title, description, icon: Icon, href, external, cta }) => {
              const cardClass = cn(
                "group flex h-full flex-col rounded-2xl border border-black/[0.06] bg-card p-6 transition-shadow hover:shadow-[0_14px_34px_-22px_rgba(0,0,0,0.35)] dark:border-white/10 sm:p-7",
                focusRing,
              )
              const body = (
                <>
                  <span className={cn(iconTile, "h-10 w-10")} aria-hidden>
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="mt-7 text-base font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  <ArrowRight
                    className="mt-6 h-4 w-4 text-primary transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                  <span className="sr-only">{cta}</span>
                </>
              )
              return (
                <li key={title}>
                  {external ? (
                    <a href={href} className={cardClass}>
                      {body}
                    </a>
                  ) : (
                    <Link href={href} className={cardClass}>
                      {body}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* 03 What we look for */}
      <section aria-labelledby="focus-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <SectionTitle number="03" eyebrow="Our focus" id="focus-heading">
          What we look for
        </SectionTitle>
        <p className="mt-4 text-sm text-foreground sm:text-[15px]">
          <strong className="font-semibold">Creators for Change</strong> is not a popularity contest. We prioritize:
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-x-8 gap-y-10 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {criteria.map(({ title, description, icon: Icon }) => (
            <li key={title}>
              <span className={cn(iconTile, "h-9 w-9")} aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold text-foreground">{title}</h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 04 Platform standards */}
      <section aria-labelledby="standards-heading" className={cn(container, "pt-20 sm:pt-24")}>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <SectionTitle number="04" eyebrow="Guidelines" id="standards-heading">
              Platform standards
            </SectionTitle>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              All participants must follow Hiffi&apos;s{" "}
              <Link href="/terms-of-use" className={inlineLink}>
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/community-guidelines" className="hover:text-foreground hover:underline">
                community guidelines
              </Link>
              . Hiffi reserves the right to feature or remove creators from program spotlights at its discretion.
              Program availability may vary by region.
            </p>
          </div>

          <ul className="flex flex-col gap-4 rounded-2xl border border-rose-100/80 bg-[#fdf7f7] p-6 dark:border-white/10 dark:bg-muted/40 sm:p-7">
            <li className="flex items-center gap-3 text-sm text-foreground">
              <CircleCheck className="h-5 w-5 shrink-0 fill-primary text-white dark:text-background" aria-hidden />
              <span>
                Follow Hiffi&apos;s{" "}
                <Link href="/terms-of-use" className={inlineLink}>
                  Terms of Use
                </Link>
              </span>
            </li>
            {["Respect community guidelines", "No harmful or misleading content", "Program availability may vary by region"].map(
              (item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                  <CircleCheck className="h-5 w-5 shrink-0 fill-primary text-white dark:text-background" aria-hidden />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
      </section>

      {/* 05 Nominate or apply */}
      <section aria-labelledby="apply-heading" className={cn(container, "py-20 sm:py-24")}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionTitle number="05" eyebrow="Next steps" id="apply-heading">
              Nominate or apply
            </SectionTitle>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Ready to join or know someone making a difference? Reach out with your Hiffi username, links to relevant
              videos, and a brief note about the impact you&apos;re creating. Approved{" "}
              <Link href="/artists" className="hover:text-foreground hover:underline">
                Hiffi Artists
              </Link>{" "}
              are eligible for creator tools and expanded reach on the platform.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={APPLY_HREF} className={primaryButton}>
                Apply as a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <a href={NOMINATE_HREF} className={lightSecondaryButton}>
                Nominate a creator
              </a>
            </div>
          </div>

          <ImageCaptionCard
            src="/creators-for-change/real-impact.jpg"
            alt="A rapper performing on stage as fans reach toward him"
            sizes="(min-width: 1024px) 480px, 100vw"
            imageClassName="object-[center_25%]"
          >
            Real artists.
            <br />
            Real stories.
            <br />
            Real impact.
          </ImageCaptionCard>
        </div>
      </section>
    </div>
  )
}
