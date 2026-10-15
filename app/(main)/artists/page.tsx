import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CloudUpload,
  Globe,
  Layers,
  Link2,
  MessageCircle,
  Music,
  PenLine,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { ARTIST_INDEX_CLAIM_PATH, ARTIST_INDEX_PATH } from "@/lib/artist-directory"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

const PAGE_PATH = "/artists"
const PAGE_TITLE = "Hiffi Artists"
const HERO_DESCRIPTION =
  "A global platform for independent hip-hop artists, rappers, producers, and DJs. Upload your music videos, reach new fans, and grow your career on Hiffi."

const BECOME_CREATOR_HREF = "/creator/apply"
const WATCH_HREF = "/"

type Item = { title: string; description: string; icon: LucideIcon }

const heroHighlights: Item[] = [
  { title: "100% Independent", description: "Built for real artists", icon: BadgeCheck },
  { title: "Global Audience", description: "Fans worldwide", icon: Globe },
  { title: "Music & Video", description: "Create and share your work", icon: Play },
]

const benefits: Item[] = [
  {
    title: "Upload & Share",
    description: "Publish music videos, freestyles, live performances, and behind-the-scenes content.",
    icon: CloudUpload,
  },
  {
    title: "Reach Real Fans",
    description: "Get discovered through genres, mood mixes, the Hiffi Artist Directory, and search.",
    icon: Users,
  },
  {
    title: "Grow Your Audience",
    description: "Build a loyal fanbase with follows, comments, likes, and shares.",
    icon: TrendingUp,
  },
  {
    title: "Stay in Control",
    description: "You own your content, your profile, and how it's presented. No label deal required.",
    icon: ShieldCheck,
  },
]

const platformPills: { label: string; icon: LucideIcon }[] = [
  { label: "Upload", icon: CloudUpload },
  { label: "Create", icon: PenLine },
  { label: "Connect", icon: MessageCircle },
  { label: "Grow", icon: TrendingUp },
]

// Neutral labels: Hiffi has no published platform-wide figures to show here.
const platformFacts: Item[] = [
  { title: "Genres", description: "Across hip-hop", icon: Layers },
  { title: "Global Fans", description: "Worldwide", icon: Globe },
  { title: "Opportunities", description: "For artists", icon: Sparkles },
]

const discoveryCards: (Item & { href: string })[] = [
  {
    title: "Discover new talent",
    description: "Find emerging artists and fresh music through Hiffi discovery.",
    icon: Search,
    href: ARTIST_INDEX_PATH,
  },
  {
    title: "Explore by genre",
    description: "Find tracks, albums, artists, and playlists across hip-hop and rap.",
    icon: Music,
    href: "/hip-hop",
  },
  {
    title: "Claim your artist profile",
    description: "Showcase your music, bio, links, and get discovered by hip-hop fans.",
    icon: UserRound,
    href: ARTIST_INDEX_CLAIM_PATH,
  },
]

const steps: Item[] = [
  {
    title: "Create your account",
    description: "Sign up and set up your artist profile with your music, bio, and social links.",
    icon: UserPlus,
  },
  {
    title: "Upload your music",
    description: "Publish your first official video and start sharing your content.",
    icon: CloudUpload,
  },
  {
    title: "Reach new fans",
    description: "Get discovered through search, genres, and the Hiffi community.",
    icon: Link2,
  },
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
const primaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] transition-colors hover:bg-primary/90",
  focusRing,
)
const darkSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10",
  focusRing,
)
const whiteButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-white/90",
  focusRing,
)
const softCard = "rounded-2xl border border-black/[0.04] bg-[#f7f7f9] dark:border-white/5 dark:bg-muted/40"

function Eyebrow({ children, ruled = false }: { children: ReactNode; ruled?: boolean }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
      {ruled ? <span className="h-px w-5 bg-primary" aria-hidden /> : null}
      {children}
    </p>
  )
}

function IconCircle({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-primary", className)}
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

const artistsFaqItems = [
  {
    question: "Who can join Hiffi as an artist?",
    answer:
      "Hiffi is open to all independent hip-hop artists, rappers, lyricists, beatmakers, producers, and DJs worldwide who create original music.",
  },
  {
    question: "How do artists publish music videos on Hiffi?",
    answer:
      "Artists can apply at hiffi.com/creator/apply or claim an existing profile in the Hiffi Artist Directory. Once verified, creators can upload videos, manage thumbnails, and engage with fans.",
  },
  {
    question: "What is the Hiffi Artist Index?",
    answer:
      "The Artist Index is a public catalog of independent hip-hop talent indexed by city and sub-genre, giving emerging artists regional and global discovery.",
  },
  {
    question: "Does Hiffi take ownership of my music?",
    answer:
      "No. Independent artists retain 100% ownership and copyright of their music, videos, and masters.",
  },
]

export default function ArtistsPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
    primaryImage: "/hiffi-artists/for-artists.jpg",
    faqItems: artistsFaqItems,
  })

  return (
    <div className="min-h-full overflow-x-clip bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section aria-labelledby="artists-hero-heading" className="relative isolate overflow-hidden bg-[#0b0b0f] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_88%_50%,rgba(237,28,47,0.28),transparent_50%)]"
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 -z-10 hidden w-[28%] bg-gradient-to-l from-[#2a070b] to-transparent lg:block"
          aria-hidden
        />

        <div
          className={cn(
            container,
            "grid items-center gap-10 py-12 sm:py-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16 lg:py-16",
          )}
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/55">
                <li>
                  <Link href="/" className="transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li aria-current="page" className="font-medium text-white/85">
                  {PAGE_TITLE}
                </li>
              </ol>
            </nav>

            <Eyebrow>For creators</Eyebrow>
            <h1 id="artists-hero-heading" className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Hiffi <span className="text-primary">Artists</span>
            </h1>
            <p className="mt-4 text-lg font-semibold sm:text-xl">Create. Share. Get Discovered.</p>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">{HERO_DESCRIPTION}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={BECOME_CREATOR_HREF} className={primaryButton}>
                Become a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={WATCH_HREF} className={darkSecondaryButton}>
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
                Watch video
              </Link>
            </div>

            <ul className="mt-9 grid max-w-xl gap-4 border-t border-white/10 pt-6 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {heroHighlights.map(({ title, description, icon: Icon }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold">{title}</span>
                    <span className="block text-xs text-white/50">{description}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[340px] md:max-w-none lg:max-w-[360px] lg:justify-self-end">
            <div className="absolute -inset-8 -z-10 rounded-full bg-primary/20 blur-3xl" aria-hidden />
            <div className="relative aspect-[944/1400] overflow-hidden rounded-[1.75rem] ring-1 ring-white/10 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)]">
              <Image
                src="/hiffi-artists/platform-performer.jpg"
                alt="An independent hip-hop artist performing on stage"
                fill
                priority
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 35vw, 340px"
                className="object-cover"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-primary/25 mix-blend-multiply"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why artists choose Hiffi */}
      <section aria-labelledby="why-heading" className={cn(container, "py-14 sm:py-20")}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div className="lg:pt-6">
            <Eyebrow ruled>Why artists choose Hiffi</Eyebrow>
            <h2 id="why-heading" className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-4xl">
              Built for artists,
              <br />
              by the culture.
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
              Hiffi gives independent hip-hop artists the tools, exposure, and community to share their music and
              reach fans worldwide — without label restrictions.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-2">
            {benefits.map(({ title, description, icon }) => (
              <li key={title} className={cn(softCard, "p-5 sm:p-6")}>
                <IconCircle icon={icon} />
                <h3 className="mt-4 text-[15px] font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Your platform */}
      <div className={container}>
        <section
          aria-labelledby="platform-heading"
          className="grid overflow-hidden rounded-3xl bg-[#0b0b0f] text-white md:grid-cols-2"
        >
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[380px]">
            <Image
              src="/hiffi-artists/for-artists.jpg"
              alt="A hip-hop artist recording vocals into a microphone"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-[center_35%]"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40 md:bg-gradient-to-r md:from-black/50 md:via-black/10 md:to-[#0b0b0f]/90"
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" aria-hidden />
            <ul className="absolute left-4 top-4 flex flex-col gap-1.5 sm:left-5 sm:top-5" aria-label="Hiffi for artists">
              {platformPills.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex w-28 items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/10 backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5 text-white/70" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p
              className="absolute bottom-4 left-4 -rotate-3 text-2xl font-black uppercase italic leading-[0.95] tracking-tight [text-shadow:0_2px_12px_rgba(0,0,0,0.85)] sm:bottom-6 sm:left-6 sm:text-3xl"
              aria-hidden
            >
              <span className="block text-primary">Music</span>
              <span className="block text-white">Creates</span>
              <span className="block text-primary">Opportunities</span>
            </p>
          </div>

          <div className="relative flex flex-col justify-center px-6 py-9 sm:px-10 md:py-12 lg:px-14">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(237,28,47,0.16),transparent_55%)]"
              aria-hidden
            />
            <div className="relative">
              <Eyebrow>Your platform</Eyebrow>
              <h2 id="platform-heading" className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Your music.
                <br />
                Your story.
                <br />
                <span className="text-primary">Your audience.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
                Share your talent, connect with fans, and be part of a global hip-hop community that supports
                independent artists.
              </p>
              <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {platformFacts.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="min-w-0">
                    <dt className="flex items-center gap-1.5 text-xs text-white/55">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                      {title}
                    </dt>
                    <dd className="mt-1.5 text-sm font-bold lg:text-lg">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </div>

      {/* Discovery */}
      <section aria-labelledby="discovery-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-primary"
            aria-hidden
          >
            3
          </span>
          <Eyebrow>Discovery</Eyebrow>
        </div>
        <h2 id="discovery-heading" className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Discover Independent <span className="text-primary">Hip-Hop Artists</span>
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Hiffi is built for the hip-hop culture. Explore new music, trending rappers, producers, and beatmakers, and
          stay connected with a community that lives and breathes hip-hop.
        </p>

        <ul className="mt-8 grid gap-3 lg:grid-cols-3 lg:gap-4">
          {discoveryCards.map(({ title, description, icon, href }) => (
            <li key={title}>
              <Link
                href={href}
                className={cn(
                  "group flex h-full items-start gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-[0_4px_16px_-12px_rgba(0,0,0,0.2)] transition-colors hover:border-primary/30",
                  focusRing,
                )}
              >
                <IconCircle icon={icon} className="h-8 w-8" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground group-hover:text-primary">{title}</span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">{description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Get started */}
      <section aria-labelledby="steps-heading" className={cn(container, "pt-14 sm:pt-16")}>
        <Eyebrow>Get started</Eyebrow>
        <h2 id="steps-heading" className="mt-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Start as a Hiffi Artist in 3 simple steps.
        </h2>
        <ol className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-10">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <li key={title} className="relative">
              <div className={cn(softCard, "flex h-full gap-4 p-5")}>
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-primary"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-foreground">
                    <span className="sr-only">Step {index + 1}: </span>
                    {title}
                  </h3>
                  <p className="mt-2 flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" aria-hidden />
                    {description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className="absolute -right-7 top-1/2 hidden -translate-y-1/2 text-muted-foreground/60 lg:block"
                  aria-hidden
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ Section */}
      <section aria-labelledby="artists-faq-heading" className={cn(container, "py-12 sm:py-16")}>
        <Eyebrow ruled>FAQ for Artists</Eyebrow>
        <h2 id="artists-faq-heading" className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Frequently asked questions about publishing on Hiffi
        </h2>
        <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
          {artistsFaqItems.map((item) => (
            <details key={item.question} className="group py-4 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-foreground hover:text-primary">
                {item.question}
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90 group-open:text-primary" aria-hidden />
              </summary>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <div className={cn(container, "pb-14 pt-12 sm:pb-20 sm:pt-14")}>
        <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden rounded-3xl bg-[#0b0b0f] text-white">
          <Image
            src="/hiffi-artists/cta-concert.jpg"
            alt="Live hip-hop concert crowd celebrating independent music"
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="-z-20 object-cover object-[75%_center] opacity-70"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/85 to-[#0b0b0f]/20"
            aria-hidden
          />
          <div className="px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
            <h2 id="cta-heading" className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to join Hiffi as an artist?
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/70">
              Create your profile, share your music, and be part of a global hip-hop community.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href={BECOME_CREATOR_HREF} className={primaryButton}>
                Become a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={ARTIST_INDEX_PATH} className={whiteButton}>
                Explore artists
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
