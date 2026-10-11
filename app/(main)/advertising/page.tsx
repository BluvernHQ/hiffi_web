import Image from "next/image"
import Link from "next/link"
import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  CircleCheck,
  Clapperboard,
  Crown,
  Megaphone,
  Music,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"

const PAGE_PATH = "/advertising"
const PAGE_TITLE = "Hiffi Advertising"
const HERO_DESCRIPTION =
  "Connect with fans who come to Hiffi specifically for hip-hop — independent artists, underground rap, freestyles, and culture-first discovery."

const CONTACT_HREF = "mailto:care@hiffi.com?subject=Hiffi%20Advertising%20Inquiry"
const COLLABORATE_HREF = "/collaborate"

type Item = { title: string; icon: LucideIcon }

const heroHighlights: Item[] = [
  { title: "Reach a dedicated hip-hop audience", icon: UsersRound },
  { title: "Authentic creator stories & content", icon: Clapperboard },
  { title: "Brand-safe and transparent partnerships", icon: ShieldCheck },
]

const formats: (Item & { description: ReactNode })[] = [
  {
    title: "Sponsored drops & premieres",
    description: "Launch new releases, albums, or brand moments with featured placement.",
    icon: Megaphone,
  },
  {
    title: "Artist collaborations",
    description: "Co-create content with Hiffi creators whose audience aligns with your brand values.",
    icon: UsersRound,
  },
  {
    title: "Hub & genre sponsorships",
    description: (
      <>
        Partner around{" "}
        <Link href="/hip-hop" className="font-medium text-primary hover:underline">
          hip-hop discovery
        </Link>{" "}
        experiences, moods, and curated collections.
      </>
    ),
    icon: Music,
  },
  {
    title: "Creator programs",
    description: "Support emerging talent through branded initiatives tied to authentic music culture.",
    icon: Star,
  },
]

const gallery = [
  {
    src: "/mail-assets/headphone_catalog_mail.png",
    alt: "Hiffi-branded studio headphones under red light",
    className: "object-[45%_center]",
  },
  {
    src: "/mail-assets/videos_imported_hero_banner.png",
    alt: "A hip-hop artist with arms raised on stage in front of a crowd",
    className: "object-center",
  },
  {
    src: "/mail-assets/hiffi_guy_catalog_mail.png",
    alt: "A producer at a mixing desk in a recording studio",
    className: "object-[center_75%]",
  },
]

const safetyChecklist = [
  "Community-first advertising",
  "Compliance with platform guidelines",
  "No sale of user data",
  "Transparent campaign processes",
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
const inlineLink = "font-semibold text-primary hover:underline"

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
    <h2 id={id} className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-[2rem]">
      {children}
    </h2>
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
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#0b0b0f] shadow-[0_24px_48px_-28px_rgba(0,0,0,0.7)]">
      <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" aria-hidden />
      <div className="absolute bottom-6 left-6 sm:bottom-7 sm:left-7">
        <p className="text-base font-semibold leading-snug text-white sm:text-lg">{children}</p>
        <span className="mt-3 block h-0.5 w-8 bg-primary" aria-hidden />
      </div>
    </div>
  )
}

const advertisingFaqItems = [
  {
    question: "What advertising formats are available on Hiffi?",
    answer:
      "Hiffi offers sponsored video premieres, featured releases, branded hub sponsorships (e.g. Atlanta hip-hop scene and genre collections), and custom creator collaborations.",
  },
  {
    question: "How do brands collaborate with Hiffi creators?",
    answer:
      "Brands can partner with verified independent rappers, producers, and videographers for authentic sponsorships, branded music videos, and organic community campaigns.",
  },
  {
    question: "Who is the primary audience on Hiffi?",
    answer:
      "Hiffi reaches highly engaged hip-hop, rap, and urban music enthusiasts who come specifically to discover independent artists, underground talent, and culture-first releases.",
  },
  {
    question: "How can our brand get started?",
    answer:
      "Reach out to our partnerships team directly via care@hiffi.com or submit the brand collaboration form at hiffi.com/collaborate.",
  },
]

export default function AdvertisingPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
    primaryImage: "/advertising/hero-artist.jpg",
    faqItems: advertisingFaqItems,
  })

  return (
    <div className="overflow-x-clip bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section aria-labelledby="advertising-hero-heading" className="relative isolate overflow-hidden bg-[#0b0b0f] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(237,28,47,0.42),transparent_55%),radial-gradient(ellipse_at_10%_100%,rgba(237,28,47,0.18),transparent_45%)]"
          aria-hidden
        />

        <div
          className={cn(
            container,
            "grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-14 lg:py-12",
          )}
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-10 lg:mb-14">
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

            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Business</p>
            <h1
              id="advertising-hero-heading"
              className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Hiffi <span className="text-primary">Advertising</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/75 sm:text-base">{HERO_DESCRIPTION}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={CONTACT_HREF} className={primaryButton}>
                Contact our team
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link href={COLLABORATE_HREF} className={darkSecondaryButton}>
                Brand collaboration form
              </Link>
            </div>

            <ul className="mt-10 grid max-w-2xl gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
              {heroHighlights.map(({ title, icon: Icon }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs leading-snug text-white/75">{title}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[360px] lg:mr-0 lg:max-w-[380px]">
            <div className="absolute -inset-6 -z-10 rounded-full bg-primary/20 blur-3xl" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
              <Image
                src="/advertising/hero-artist.jpg"
                alt="A hip-hop artist performing into a microphone in a dark spotlight"
                fill
                priority
                sizes="(min-width: 1024px) 380px, 360px"
                className="object-cover object-[42%_center]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-primary/35 mix-blend-multiply"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" aria-hidden />
              <Crown className="absolute left-5 top-5 h-8 w-8 text-primary" aria-hidden />
              <p
                className="absolute right-5 top-5 -rotate-6 text-right text-sm font-black uppercase italic leading-tight tracking-wide [text-shadow:0_2px_10px_rgba(0,0,0,0.7)]"
                aria-hidden
              >
                <span className="block text-primary">Real</span>
                <span className="block text-white">Artists</span>
                <span className="block text-primary">Real</span>
                <span className="block text-white">Culture</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 01 Why advertise */}
      <section aria-labelledby="why-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionLabel number="01">Why advertise on Hiffi</SectionLabel>
            <SectionHeading id="why-heading">Why advertise on Hiffi</SectionHeading>
            <div className="mt-5 max-w-2xl space-y-4 text-[15px] leading-relaxed text-muted-foreground">
              <p>
                Unlike general video platforms,{" "}
                <strong className="font-semibold text-foreground">Hiffi is built for hip-hop culture.</strong> Your
                brand reaches listeners and creators who are actively seeking rap music, music videos, and authentic
                artist stories — not a generic feed where music is one category among thousands.
              </p>
              <p>
                That focus means higher relevance: campaigns sit alongside content your audience already cares about.
              </p>
            </div>
            <Link href="/about" className={cn(inlineLink, "mt-6 inline-flex items-center gap-1 rounded text-sm")}>
              Learn more about Hiffi
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <ImageCaptionCard
            src="/mail-assets/videos_imported_banner.png"
            alt="A packed hip-hop concert crowd under red stage lights"
            sizes="(min-width: 1024px) 460px, 100vw"
          >
            A focused audience.
            <br />A real culture.
            <br />
            Real impact.
          </ImageCaptionCard>
        </div>
      </section>

      {/* 02 Partnership formats */}
      <section aria-labelledby="formats-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <SectionLabel number="02">Partnership formats</SectionLabel>
        <SectionHeading id="formats-heading">Partnership formats</SectionHeading>
        <p className="mt-3 text-[15px] text-muted-foreground">
          Multiple ways to collaborate based on your brand goals and audience.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {formats.map(({ title, description, icon: Icon }) => (
            <li
              key={title}
              className="rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] dark:border-white/10 sm:p-6"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-primary dark:bg-primary/15"
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-6 text-[15px] font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* 03 Who we work with */}
      <section aria-labelledby="partners-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionLabel number="03">Who we work with</SectionLabel>
            <SectionHeading id="partners-heading">Who we work with</SectionHeading>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              We partner with labels, distributors, lifestyle brands, audio gear companies, festivals, and
              mission-aligned organizations that respect artist-first values. All campaigns are reviewed to ensure
              they fit Hiffi&apos;s{" "}
              <Link href="/community-guidelines" className="font-medium text-primary hover:underline">
                community standards
              </Link>{" "}
              and creator guidelines.
            </p>
          </div>

          <ul className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {gallery.map(({ src, alt, className }) => (
              <li
                key={src}
                className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#0b0b0f] shadow-[0_16px_32px_-22px_rgba(0,0,0,0.7)]"
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 190px, 33vw"
                  className={cn("object-cover", className)}
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 Brand safety */}
      <section aria-labelledby="safety-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <SectionLabel number="04">Brand safety &amp; transparency</SectionLabel>
        <SectionHeading id="safety-heading">Brand safety &amp; transparency</SectionHeading>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="flex gap-4 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-6 dark:border-white/10 dark:bg-muted/40 sm:gap-5 sm:p-7">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-primary dark:bg-primary/15"
              aria-hidden
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Hiffi prioritizes a safe environment for creators and fans. Advertising partnerships must comply with
              our{" "}
              <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/community-guidelines" className="font-medium text-primary hover:underline">
                community guidelines
              </Link>
              . We do not sell user data for unrelated third-party marketing — see our{" "}
              <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </div>

          <ul className="flex flex-col justify-center gap-3.5 rounded-2xl border border-black/[0.06] bg-[#fafafa] p-6 dark:border-white/10 dark:bg-muted/40 sm:p-7">
            {safetyChecklist.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-foreground">
                <CircleCheck className="h-5 w-5 shrink-0 fill-primary text-white dark:text-background" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 05 Get started */}
      <section aria-labelledby="start-heading" className={cn(container, "pt-16 sm:pt-20")}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            <SectionLabel number="05">Get started</SectionLabel>
            <SectionHeading id="start-heading">Get started</SectionHeading>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Tell us about your campaign goals, target audience, and timeline. Our team will follow up with available
              formats, reach estimates, and next steps. For structured partnership inquiries, you can also use the{" "}
              <Link href={COLLABORATE_HREF} className={inlineLink}>
                brand collaboration form
              </Link>
              .
            </p>
          </div>

          <ImageCaptionCard
            src="/advertising/get-started-performer.jpg"
            alt="A rapper performing into a microphone with his arm raised under red stage lights"
            sizes="(min-width: 1024px) 500px, 100vw"
            imageClassName="object-[center_30%]"
          >
            Let&apos;s build something
            <br />
            authentic together.
          </ImageCaptionCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section aria-labelledby="advertising-faq-heading" className={cn(container, "py-12 sm:py-16")}>
        <SectionLabel number="06">Frequently Asked Questions</SectionLabel>
        <h2 id="advertising-faq-heading" className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Advertising and brand partnerships on Hiffi
        </h2>
        <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border/70 bg-card p-6 sm:p-8">
          {advertisingFaqItems.map((item) => (
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
      <div className={cn(container, "pb-16 pt-8 sm:pb-20 sm:pt-10")}>
        <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden rounded-3xl bg-[#0b0b0f] text-white">
          <Image
            src="/mail-assets/videos_imported_cta_strip.png"
            alt="Hiffi artist streaming and music video showcase banner"
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            className="-z-20 scale-105 object-cover object-[center_40%] opacity-60 blur-[2px]"
          />
          <div
            className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0b0b0f] via-[#0b0b0f]/85 to-[#2a070b]/60"
            aria-hidden
          />
          <div className="flex flex-col gap-7 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Ready to get started?</p>
              <h2 id="cta-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Partner with Hiffi
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                Join the Hiffi community — whether you&apos;re creating or discovering hip-hop culture.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <a href={CONTACT_HREF} className={primaryButton}>
                Contact our team
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <Link href={COLLABORATE_HREF} className={darkSecondaryButton}>
                Brand collaboration form
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
