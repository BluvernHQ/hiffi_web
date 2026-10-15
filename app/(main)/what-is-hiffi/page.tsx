import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  AudioLines,
  ChevronRight,
  CloudUpload,
  Heart,
  Mic,
  Music,
  Play,
  UserPlus,
  Users,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildSignupUrl } from "@/lib/auth-utils"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

import { Plus } from "lucide-react"

const PAGE_PATH = "/what-is-hiffi"
const PAGE_TITLE = "What is Hiffi?"
// Skip on the signup page (and a completed signup) returns here.
const SIGNUP_HREF = buildSignupUrl(PAGE_PATH)
const HERO_DESCRIPTION =
  "Hiffi is an artist-first hip-hop platform where independent artists share music videos, freestyles, and exclusive releases, and grow their audience — starting from Atlanta's rap scene. Not affiliated with other HIFFI brands."

const faqItems = [
  {
    question: "What is Hiffi?",
    answer:
      "Hiffi is a music and video streaming platform where hip-hop creators publish official music videos and audiences watch, listen, follow artists, and support creators.",
  },
  {
    question: "Where can I access Hiffi?",
    answer:
      "You can use Hiffi on the web at hiffi.com and through official mobile apps on iOS and Android.",
  },
  {
    question: "Is Hiffi free for fans to watch and listen?",
    answer:
      "Yes, fans can explore curated hip-hop feeds, stream music videos, follow independent artists, and discover underground talent completely free.",
  },
  {
    question: "How do independent artists get their music on Hiffi?",
    answer:
      "Independent rappers, producers, and DJs can apply through the Creator portal at hiffi.com/creator/apply or claim their existing profile in the Hiffi Artist Index to upload official videos and access creator tools.",
  },
]

type Feature = {
  title: string
  description: string
  icon: LucideIcon
  iconClassName: string
}

const features: Feature[] = [
  {
    title: "Discover New Artists",
    description: "Find emerging and established hip-hop artists from around the world.",
    icon: Users,
    iconClassName: "bg-rose-100 text-primary",
  },
  {
    title: "Build Playlists",
    description: "Create your own playlists and save your favorite tracks and videos.",
    icon: Music,
    iconClassName: "bg-violet-100 text-violet-600",
  },
  {
    title: "Join the Community",
    description: "Follow artists, comment, and be part of the hip-hop culture.",
    icon: Heart,
    iconClassName: "bg-orange-100 text-orange-500 [&_svg]:fill-current",
  },
]

type Audience = {
  title: string
  description: string
  linkLabel: string
  href: string
  image: string
  imageAlt: string
  icon: LucideIcon
  panelClassName: string
  iconClassName: string
  imageClassName?: string
}

const audiences: Audience[] = [
  {
    title: "For Artists",
    description:
      "Rappers, producers, DJs, and beatmakers looking to share music, grow their audience, and connect with hip-hop fans.",
    linkLabel: "See Hiffi Artists",
    href: "/artists",
    image: "/what-is-hiffi/for-artists-studio.jpg",
    imageAlt: "Hip-hop artist recording vocals into a studio microphone under red light",
    icon: Mic,
    panelClassName: "bg-rose-50",
    iconClassName: "bg-primary text-primary-foreground",
  },
  {
    title: "For Fans",
    description:
      "Discover underground rap, drill, trap, boom bap, and emerging independent artists in one place.",
    linkLabel: "Explore the hip-hop hub",
    href: "/hip-hop",
    image: "/what-is-hiffi/for-fans.png",
    imageAlt: "Fan listening to music on headphones under purple lights",
    icon: Users,
    panelClassName: "bg-violet-50",
    iconClassName: "bg-violet-200 text-violet-700",
  },
]

type Step = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

const steps: Step[] = [
  {
    title: "Create a free account",
    description: "Sign up and join the Hiffi community.",
    href: SIGNUP_HREF,
    icon: UserPlus,
  },
  {
    title: "Explore artists and videos",
    description: "Discover new artists, music videos, and freestyles.",
    href: "/",
    icon: Play,
  },
  {
    title: "Apply as a creator",
    description: "Artists can apply to publish music videos and reach hip-hop fans.",
    href: "/creator/apply",
    icon: CloudUpload,
  },
]

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{children}</p>
  )
}

export default function WhatIsHiffiPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
    primaryImage: "/what-is-hiffi/hero-collage.jpg",
    faqItems,
  })

  return (
    <div className="min-h-full overflow-x-clip bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#07070b] text-white">
        <Image
          src="/what-is-hiffi/hero-collage.jpg"
          alt="Hiffi hip-hop artists, music videos, and streaming platform"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[78%_center] md:object-right"
        />
        <div
          className="absolute inset-0 -z-10 bg-black/70 md:bg-transparent md:bg-gradient-to-r md:from-[#07070b] md:via-[#07070b]/70 md:to-transparent lg:via-[#07070b]/40"
          aria-hidden
        />

        <div className="mx-auto flex min-h-[380px] w-full flex-col justify-center px-[27px] md:px-12 lg:px-16 py-12 md:min-h-[400px] lg:min-h-[440px]">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/70 sm:text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-white">
                {PAGE_TITLE}
              </li>
            </ol>
          </nav>

          <div className="max-w-xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              What is <span className="text-primary">Hiffi?</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">{HERO_DESCRIPTION}</p>
            <div className="mt-8">
              <Link
                href={SIGNUP_HREF}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.35)] transition-colors hover:bg-primary/90"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden />
                Join Hiffi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full px-[27px] md:px-12 lg:px-16">
        {/* The platform */}
        <section aria-labelledby="the-platform-heading" className="pt-14 sm:pt-16">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
            <div>
              <SectionLabel>The platform</SectionLabel>
              <h2
                id="the-platform-heading"
                className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl"
              >
                More than music videos.
                <br />
                A home for hip-hop culture.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Hiffi is an artist-first platform focused on hip-hop and rap. Creators share music videos,
                freestyles, and culture-driven content. Fans can discover new talent, follow artists, build
                playlists, and engage with the community — on web and mobile.
              </p>
            </div>

            <Link
              href="/"
              aria-label="Watch hip-hop music videos on Hiffi"
              className="group relative block aspect-[9/4] overflow-hidden rounded-2xl bg-black shadow-[0_18px_40px_-16px_rgba(0,0,0,0.45)]"
            >
              <Image
                src="/what-is-hiffi/platform-stage.png"
                alt="Hip-hop artist performing to a live crowd"
                fill
                sizes="(min-width: 1024px) 520px, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-0 bg-black/10" aria-hidden />
              <span
                className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition-transform group-hover:scale-105"
                aria-hidden
              >
                <Play className="ml-0.5 h-6 w-6 fill-current" />
              </span>
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
                <AudioLines className="h-3.5 w-3.5 text-primary" aria-hidden />
                Atlanta · Hip-Hop · Independent
              </span>
            </Link>
          </div>

          {/* Feature cards */}
          <ul className="mt-10 grid gap-4 md:grid-cols-3 lg:gap-5">
            {features.map(({ title, description, icon: Icon, iconClassName }) => (
              <li
                key={title}
                className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-6 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.18)]"
              >
                <span
                  className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconClassName)}
                  aria-hidden
                >
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Who Hiffi is built for */}
        <section aria-labelledby="built-for-heading" className="pt-14 sm:pt-16">
          <SectionLabel>Who Hiffi is built for</SectionLabel>
          <h2
            id="built-for-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            A platform for creators and fans.
          </h2>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {audiences.map((a) => {
              const Icon = a.icon
              return (
                <article
                  key={a.title}
                  className={cn(
                    "grid grid-cols-1 overflow-hidden rounded-2xl sm:grid-cols-[38%_minmax(0,1fr)]",
                    a.panelClassName,
                  )}
                >
                  <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-[180px]">
                    <Image
                      src={a.image}
                      alt={a.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 220px, (min-width: 640px) 38vw, 100vw"
                      className={cn("object-cover object-top", a.imageClassName)}
                    />
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn("flex h-9 w-9 items-center justify-center rounded-full", a.iconClassName)}
                        aria-hidden
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      <h3 className="text-lg font-bold text-foreground">{a.title}</h3>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{a.description}</p>
                    <Link
                      href={a.href}
                      className="mt-4 inline-flex w-fit items-center gap-2 text-[15px] font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {a.linkLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* How to get started */}
        <section aria-labelledby="get-started-heading" className="py-14 sm:py-16">
          <SectionLabel>How to get started</SectionLabel>
          <h2
            id="get-started-heading"
            className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
          >
            Start in 3 simple steps.
          </h2>

          <ol className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-8">
            {steps.map(({ title, description, href, icon: Icon }, index) => (
              <li key={title} className="relative">
                <Link
                  href={href}
                  className="flex h-full items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.18)] transition-colors hover:border-primary/30"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-base font-bold text-primary"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-foreground">{title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span>
                  </span>
                </Link>
                {index < steps.length - 1 ? (
                  <span
                    className="absolute -right-6 top-1/2 hidden -translate-y-1/2 text-muted-foreground/60 lg:block"
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
        <section aria-labelledby="faq-heading" className="py-14 sm:py-16">
          <SectionLabel>Frequently asked questions</SectionLabel>
          <h2 id="faq-heading" className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Everything you need to know about Hiffi.
          </h2>
          <div className="mt-8 divide-y divide-border/60 rounded-2xl border border-border/70 bg-card">
            {faqItems.map((item) => (
              <details key={item.question} className="group p-5 first:rounded-t-2xl last:rounded-b-2xl">
                <summary className="flex cursor-pointer list-none items-center justify-between text-base font-semibold text-foreground hover:text-primary">
                  {item.question}
                  <Plus className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 group-open:text-primary" aria-hidden />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="mx-auto w-full px-[27px] pb-14 md:px-12 lg:px-16 sm:pb-16">
        <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden rounded-3xl bg-[#1a0306] text-white">
          <Image
            src="/what-is-hiffi/cta-crowd.jpg"
            alt="Concert crowd cheering at a live hip-hop performance"
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="-z-20 object-cover object-[70%_center]"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1a0306]/95 via-[#1a0306]/75 to-[#1a0306]/20"
            aria-hidden
          />
          <div className="px-6 py-12 sm:px-10 sm:py-14 lg:px-12">
            <h2 id="cta-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mt-3 max-w-xl text-base text-white/85">
              Join the Hiffi community — whether you&apos;re creating or discovering hip-hop culture.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={SIGNUP_HREF}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.35)] transition-colors hover:bg-primary/90"
              >
                Join Hiffi
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Learn how it works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
