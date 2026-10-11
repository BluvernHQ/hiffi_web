import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  CloudUpload,
  Globe,
  Heart,
  ListVideo,
  Play,
  Search,
  Smartphone,
  UserPlus,
  Users,
  Video,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildSignupUrl } from "@/lib/auth-utils"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

const PAGE_PATH = "/how-it-works"
const PAGE_TITLE = "How Hiffi Works"
// Skip on the signup page (and a completed signup) returns here.
const SIGNUP_HREF = buildSignupUrl(PAGE_PATH)
const HERO_DESCRIPTION =
  "Learn how Hiffi works for fans and independent artists — create an account, discover hip-hop music videos, upload your music, and grow your audience."

type Step = {
  title: string
  description: string
  icon: LucideIcon
  iconClassName?: string
}

const fanSteps: Step[] = [
  {
    title: "Create an account",
    description: "Sign up free and join the Hiffi community.",
    icon: UserPlus,
  },
  {
    title: "Discover",
    description: "Explore the home feed, search artists, and find new music videos.",
    icon: Search,
  },
  {
    title: "Engage",
    description: "Follow artists, like videos, comment, and save your favorites.",
    icon: Heart,
    iconClassName: "[&_svg]:fill-current",
  },
  {
    title: "Stay connected",
    description: "Use Following to see new uploads from artists you care about.",
    icon: ListVideo,
  },
]

const creatorSteps: Step[] = [
  {
    title: "Create an account",
    description: "Sign up, then become a creator.",
    icon: UserPlus,
  },
  {
    title: "Upload",
    description: "Publish official music videos, freestyles, live performances, and more.",
    icon: CloudUpload,
  },
  {
    title: "Get discovered",
    description: "Reach hip-hop fans through genres, mood mixes, artist profiles, and search.",
    icon: BarChart3,
  },
  {
    title: "Build your audience",
    description: "Grow through follows, comments, and repeat viewers.",
    icon: Users,
  },
]

type Platform = {
  title: string
  description: ReactNode
  icon: LucideIcon
}

const linkClassName = "font-medium text-primary underline-offset-4 hover:underline"

const platforms: Platform[] = [
  {
    title: "Web",
    description: (
      <>
        Stream videos and discover new artists on{" "}
        <Link href="/" className={linkClassName}>
          hiffi.com
        </Link>
        .
      </>
    ),
    icon: Globe,
  },
  {
    title: "iOS & Android",
    description: (
      <>
        Watch music videos and stay connected on our{" "}
        <Link href="/app" className={linkClassName}>
          mobile app
        </Link>
        .
      </>
    ),
    icon: Smartphone,
  },
  {
    title: "Hiffi Studio",
    description: (
      <>
        Upload, edit, and manage your content with{" "}
        <Link href="/studio" className={linkClassName}>
          Hiffi Studio
        </Link>
        .
      </>
    ),
    icon: Video,
  },
]

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{children}</p>
}

function SectionNumber({ value }: { value: number }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-base font-bold text-primary sm:h-11 sm:w-11 sm:text-lg"
      aria-hidden
    >
      {value}
    </span>
  )
}

function SectionHeader({
  number,
  label,
  title,
  titleId,
  description,
}: {
  number: number
  label: string
  title: string
  titleId: string
  description: string
}) {
  return (
    <div className="flex gap-4 sm:gap-6">
      <SectionNumber value={number} />
      <div className="min-w-0">
        <SectionLabel>{label}</SectionLabel>
        <h2
          id={titleId}
          className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl"
        >
          {title}
        </h2>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
    </div>
  )
}

function StepCards({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-10">
      {steps.map(({ title, description, icon: Icon, iconClassName }, index) => (
        <li key={title} className="relative">
          <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.18)] lg:p-6">
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-primary",
                iconClassName,
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-[15px] font-bold text-foreground">
              {index + 1}. {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
          {index < steps.length - 1 ? (
            <span
              className="absolute -right-7 top-1/2 hidden -translate-y-1/2 text-muted-foreground/70 lg:block"
              aria-hidden
            >
              <ArrowRight className="h-4 w-4" />
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export default function HowItWorksPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
  })

  return (
    <div className="min-h-full overflow-x-clip bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#07070b] text-white">
        <Image
          src="/how-it-works/hero-rapper.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[72%_center] md:object-right"
        />
        <div
          className="absolute inset-0 -z-10 bg-black/65 md:bg-transparent md:bg-gradient-to-r md:from-[#07070b] md:via-[#07070b]/75 md:to-transparent lg:via-[#07070b]/45"
          aria-hidden
        />

        <div className="mx-auto flex min-h-[380px] w-full flex-col justify-center px-[27px] py-12 md:min-h-[400px] md:px-12 lg:min-h-[440px] lg:px-16">
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
              <li>Product</li>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-white">
                {PAGE_TITLE}
              </li>
            </ol>
          </nav>

          <div className="max-w-xl">
            <SectionLabel>Product</SectionLabel>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              How Hiffi <span className="text-primary">Works</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85 sm:text-lg">{HERO_DESCRIPTION}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={SIGNUP_HREF}
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.35)] transition-colors hover:bg-primary/90"
              >
                Join Hiffi
              </Link>
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/70 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Play className="h-4 w-4 text-primary" aria-hidden />
                Watch videos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full px-4 md:px-8 lg:px-10">
        {/* For fans */}
        <section aria-labelledby="for-fans-heading" className="px-[11px] pt-10 sm:pt-12 md:px-4 lg:px-6">
          <SectionHeader
            number={1}
            label="For fans"
            title="Discover, follow, and be part of the culture."
            titleId="for-fans-heading"
            description="Explore independent hip-hop artists, watch music videos, and connect with a global community of fans."
          />
          <StepCards steps={fanSteps} />
        </section>

        {/* For creators */}
        <section
          aria-labelledby="for-creators-heading"
          className="mt-8 rounded-3xl bg-rose-50/70 px-[11px] py-8 sm:py-10 md:px-4 lg:px-6"
        >
          <SectionHeader
            number={2}
            label="For creators"
            title="Share your music with the world."
            titleId="for-creators-heading"
            description="Upload music videos, grow your audience, and connect directly with hip-hop fans — no application wait."
          />
          <StepCards steps={creatorSteps} />
        </section>

        {/* Where to watch and upload */}
        <section
          aria-labelledby="devices-heading"
          className="grid items-center gap-10 px-[11px] pt-10 sm:pt-12 md:px-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-8 lg:px-6"
        >
          <div>
            <SectionHeader
              number={3}
              label="Where to watch and upload"
              title="On all your devices."
              titleId="devices-heading"
              description="Watch hip-hop music videos, stay connected with your favorite artists, and upload content anytime, anywhere."
            />
            <ul className="mt-8 grid gap-6 sm:grid-cols-3 sm:pl-[68px]">
              {platforms.map(({ title, description, icon: Icon }) => (
                <li key={title}>
                  <Icon className="h-7 w-7 text-foreground" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 text-[15px] font-bold text-foreground">{title}</h3>
                  <p className="mt-2 max-w-[13rem] text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel matches the artwork's baked-in pink; multiply hides the image's opaque edges. */}
          <div className="mx-auto w-full max-w-[560px] rounded-[2rem] bg-[#fcf3f6] p-3 sm:p-5">
            <Image
              src="/how-it-works/devices.png"
              alt="Hiffi on a laptop and a mobile phone, showing hip-hop music videos"
              width={415}
              height={245}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full mix-blend-multiply"
            />
          </div>
        </section>

        {/* Learn more */}
        <section
          aria-labelledby="learn-more-heading"
          className="mt-10 flex flex-col gap-5 rounded-2xl bg-rose-50/70 px-[11px] py-6 sm:mt-12 md:flex-row md:items-center md:justify-between md:px-4 lg:px-6"
        >
          <div className="flex gap-4 sm:gap-6">
            <SectionNumber value={4} />
            <div className="min-w-0">
              <SectionLabel>Learn more</SectionLabel>
              <h2
                id="learn-more-heading"
                className="mt-1.5 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl"
              >
                Need more help?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Creators should read the{" "}
                <Link href="/creator-playbook" className={linkClassName}>
                  Creator Playbook
                </Link>
                . For account help, visit{" "}
                <Link href="/faq" className={linkClassName}>
                  FAQ
                </Link>{" "}
                or{" "}
                <Link href="/support" className={linkClassName}>
                  Support
                </Link>
                .
              </p>
            </div>
          </div>
          <Link
            href="/creator-playbook"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary/30 md:self-auto"
          >
            View Creator Playbook
            <ArrowRight className="h-4 w-4 text-primary" aria-hidden />
          </Link>
        </section>

        {/* Bottom CTA */}
        <section
          aria-labelledby="cta-heading"
          className="relative isolate mt-6 overflow-hidden rounded-2xl bg-[#1a0306] text-white sm:mt-8"
        >
          <Image
            src="/how-it-works/cta-crowd.png"
            alt=""
            fill
            sizes="100vw"
            className="-z-20 object-cover object-[70%_center]"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1a0306]/95 via-[#1a0306]/65 to-transparent"
            aria-hidden
          />
          <div className="px-6 py-10 sm:px-10 sm:py-12">
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
                href="/creator/apply"
                className="inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-black transition-colors hover:bg-white/90"
              >
                Become a creator
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
