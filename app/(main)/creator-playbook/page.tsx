import Link from "next/link"
import type { ReactNode } from "react"
import {
  ArrowRight,
  ChevronRight,
  ClipboardList,
  Crown,
  Lightbulb,
  Mic,
  Play,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { JsonLd } from "@/components/seo/json-ld"
import { buildContentPageJsonLd } from "@/lib/seo/content-page-json-ld"
import { cn } from "@/lib/utils"
import { LaunchChecklist } from "./launch-checklist"
import { PhaseNav } from "./phase-nav"

const PAGE_PATH = "/creator-playbook"
const PAGE_TITLE = "Creator Playbook"
const HERO_DESCRIPTION =
  "The Hiffi Creator Playbook for independent rappers and hip-hop artists — become a creator, upload music videos, and grow your fanbase."
const HERO_IMAGE = "/how-it-works/devices.png"

const playbookFaqItems = [
  {
    question: "Who is the Hiffi Creator Playbook designed for?",
    answer:
      "The Creator Playbook is crafted for independent rappers, MCs, beatmakers, producers, and directors who want to upload official music videos, build a dedicated fanbase, and grow across Hiffi's hip-hop ecosystem.",
  },
  {
    question: "How do I become a creator and start uploading videos?",
    answer:
      "Sign up for a free Hiffi account, complete your profile photo and bio, and visit the Become a Creator page. Creator access is enabled instantly without long waiting periods.",
  },
  {
    question: "What video formats and quality standards does Hiffi support?",
    answer:
      "Hiffi supports HD and 4K MP4/MOV video uploads. For optimal playback and recommendation performance, upload clear audio mixdowns and high-resolution mobile-optimized cover artwork.",
  },
  {
    question: "Do artists keep rights to the music and videos they upload?",
    answer:
      "Yes. Independent artists maintain 100% ownership and intellectual property rights to their uploaded music and video content in accordance with Hiffi's Terms of Use.",
  },
 
]

const BECOME_CREATOR_HREF = "/creator/apply"
const HOW_IT_WORKS_HREF = "/how-it-works"

const phaseNavItems = [
  { label: "9-Step Strategy", targetId: "phase-1", highlight: true },
  { label: "Phase 1: Setup", targetId: "phase-1" },
  { label: "Phase 2: Strategy & Video", targetId: "phase-2" },
  { label: "Phase 3: Growth", targetId: "phase-3" },
  { label: "Phase 4: Launch Checklist", targetId: "phase-4" },
]

const launchChecklist = [
  "Hiffi account created",
  "Become a creator on Hiffi",
  "Profile photo and bio complete",
  "First official music video uploaded",
  "Title, description, and thumbnail optimized for mobile",
  "Watch link shared on at least one social platform",
  "Replied to early comments on your first upload",
]

const container = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-12"
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f]"
const primaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_rgba(237,28,47,0.3)] transition-colors hover:bg-primary/90 active:bg-primary/80",
  focusRing,
)
const darkSecondaryButton = cn(
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/25 bg-black/30 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 active:bg-white/15",
  focusRing,
)
const inlineLink = "font-semibold text-primary hover:underline"

/* ---------- Layout primitives ---------- */

function PhaseHeader({ id, phase, title, meta }: { id: string; phase: string; title: string; meta: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex items-center gap-3">
        <span className="rounded border border-primary/30 bg-primary/[0.06] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          {phase}
        </span>
        <h2 id={id} className="text-base font-bold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}

function PlaybookCard({
  headingId,
  eyebrow,
  number,
  title,
  footerLabel,
  illustration,
  glow,
  compact,
  className,
  children,
}: {
  headingId: string
  eyebrow: string
  number?: string
  title: string
  footerLabel: ReactNode
  illustration: ReactNode
  glow?: boolean
  compact?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-card shadow-[0_10px_30px_-24px_rgba(0,0,0,0.3)] dark:border-white/10",
        compact ? "p-5 sm:p-6" : "p-5 sm:p-7 lg:p-8",
        className,
      )}
    >
      {glow && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(237,28,47,0.08),transparent_70%)]"
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <span className="rounded bg-primary/[0.07] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </span>
        {number && (
          <span
            className={cn(
              "font-bold leading-none tracking-tight text-primary",
              compact ? "text-2xl sm:text-[1.75rem]" : "text-3xl sm:text-4xl",
            )}
            aria-hidden
          >
            {number}
          </span>
        )}
      </div>
      <h3
        id={headingId}
        className={cn(
          "font-bold tracking-tight text-foreground",
          compact ? "mt-4 text-lg leading-snug sm:text-xl" : "mt-5 text-xl sm:text-2xl",
        )}
      >
        {title}
      </h3>
      <div className={cn("mt-4 flex-1 leading-relaxed text-muted-foreground", compact ? "text-[13px]" : "text-sm")}>
        {children}
      </div>
      <div className="mt-8 flex items-end justify-between gap-4 border-t border-black/[0.06] pt-5 dark:border-white/10">
        <p className="text-[11px] text-muted-foreground/80">{footerLabel}</p>
        <div className="shrink-0">{illustration}</div>
      </div>
    </article>
  )
}

function BulletList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn("space-y-3", className)}>{children}</ul>
}

function Bullet({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
      <span>{children}</span>
    </li>
  )
}

function Term({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/* ---------- Illustrations ---------- */

function ProfileIllustration({ active }: { active?: boolean }) {
  return (
    <div className="relative" aria-hidden>
      <div className="flex h-14 w-14 flex-col items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-white shadow-[0_8px_20px_-12px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-white/5">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full",
            active ? "bg-primary/10 text-primary" : "bg-black/[0.06] text-black/40 dark:bg-white/10 dark:text-white/50",
          )}
        >
          <UserRound className="h-4 w-4" />
        </span>
        <span className="h-0.5 w-6 rounded-full bg-black/10 dark:bg-white/15" />
      </div>
      <span className="absolute -bottom-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-white">
        +
      </span>
    </div>
  )
}

function VideoIllustration({ lines }: { lines?: boolean }) {
  return (
    <div
      className="w-16 overflow-hidden rounded-lg border border-black/[0.08] bg-white shadow-[0_8px_20px_-12px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-white/5"
      aria-hidden
    >
      <div className="flex h-2.5 items-center gap-0.5 bg-primary px-1.5">
        <span className="h-0.5 w-0.5 rounded-full bg-white" />
        <span className="h-0.5 w-0.5 rounded-full bg-white" />
        <span className="h-0.5 w-0.5 rounded-full bg-white" />
      </div>
      <div className="flex flex-col items-center gap-1.5 px-2 py-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Play className="ml-px h-2.5 w-2.5 fill-white text-white" />
        </span>
        {lines && (
          <>
            <span className="h-0.5 w-full rounded-full bg-black/10 dark:bg-white/15" />
            <span className="h-0.5 w-3/4 self-start rounded-full bg-black/10 dark:bg-white/15" />
          </>
        )}
      </div>
    </div>
  )
}

function TrendIllustration() {
  return (
    <svg viewBox="0 0 56 48" className="h-12 w-14" fill="none" aria-hidden>
      <rect x="4" y="32" width="9" height="14" rx="1.5" className="fill-primary/25" />
      <rect x="18" y="24" width="9" height="22" rx="1.5" className="fill-primary/50" />
      <rect x="32" y="16" width="9" height="30" rx="1.5" className="fill-primary" />
      <rect x="45" y="8" width="7" height="38" rx="1.5" className="fill-primary" />
      <path
        d="M6 26 L22 14 L30 20 L44 4"
        className="stroke-primary"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M36 4 H44 V12" className="stroke-primary" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChatIllustration() {
  return (
    <div className="relative h-14 w-14" aria-hidden>
      <span className="absolute left-0 top-0 flex h-6 w-8 flex-col items-center justify-center gap-1 rounded-lg bg-primary">
        <span className="h-0.5 w-4 rounded-full bg-white" />
        <span className="h-0.5 w-3 rounded-full bg-white" />
      </span>
      <span className="absolute bottom-0 right-0 flex h-6 w-8 flex-col items-center justify-center gap-1 rounded-lg border border-black/[0.08] bg-white shadow-[0_6px_14px_-8px_rgba(0,0,0,0.3)] dark:border-white/10 dark:bg-white/5">
        <span className="h-0.5 w-4 rounded-full bg-black/15 dark:bg-white/20" />
        <span className="h-0.5 w-3 rounded-full bg-black/15 dark:bg-white/20" />
      </span>
    </div>
  )
}

function IconIllustration({ icon: Icon }: { icon: typeof ShieldCheck }) {
  return <Icon className="h-11 w-11 text-primary" strokeWidth={1.75} aria-hidden />
}

function HeroIllustration() {
  const bars = [38, 62, 46, 30, 54, 72, 26, 50]
  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:mr-0" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_45%,rgba(237,28,47,0.22),transparent_65%),linear-gradient(160deg,#18080b,#0b0b0f_60%)] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)]">
        <Crown className="absolute left-5 top-5 h-8 w-8 text-primary sm:left-6 sm:top-6" strokeWidth={2} />

        <p className="absolute right-5 top-6 rotate-6 rounded border-2 border-primary px-2 py-1 text-center text-[10px] font-black uppercase italic leading-tight tracking-wide text-primary sm:right-6">
          <span className="block">Create</span>
          <span className="block">Upload</span>
          <span className="block">Grow</span>
        </p>

        <div className="absolute inset-x-0 top-[28%] flex flex-col items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/[0.04] sm:h-16 sm:w-16">
            <Mic className="h-6 w-6 text-white sm:h-7 sm:w-7" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 sm:text-[10px]">
            Hip-hop creator hub
          </span>
        </div>

        <div className="absolute inset-x-6 bottom-0 flex h-[42%] items-end justify-between">
          {bars.map((height, index) => (
            <span
              key={index}
              className="w-2.5 rounded-t-sm bg-gradient-to-t from-primary/30 to-primary/80 sm:w-3"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Page ---------- */

export default function CreatorPlaybookPage() {
  const pageJsonLd = buildContentPageJsonLd({
    path: PAGE_PATH,
    title: PAGE_TITLE,
    description: HERO_DESCRIPTION,
    breadcrumbLabel: PAGE_TITLE,
    primaryImage: HERO_IMAGE,
    faqItems: playbookFaqItems,
  })

  return (
    <div className="overflow-x-clip bg-[#fcf8f7] dark:bg-background">
      <JsonLd data={pageJsonLd} />

      {/* Hero */}
      <section aria-labelledby="playbook-hero-heading" className="relative isolate overflow-hidden bg-[#0b0b0f] text-white">
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_35%_60%,rgba(237,28,47,0.28),transparent_55%),radial-gradient(ellipse_at_85%_10%,rgba(237,28,47,0.12),transparent_45%)]"
          aria-hidden
        />

        <div
          className={cn(
            container,
            "grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 lg:py-20",
          )}
        >
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/60">
                <li>
                  <Link href="/" className="rounded transition-colors hover:text-white">
                    Home
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li>Creators</li>
                <li aria-hidden>
                  <ChevronRight className="h-3.5 w-3.5" />
                </li>
                <li aria-current="page" className="font-medium text-white/90">
                  {PAGE_TITLE}
                </li>
              </ol>
            </nav>

            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              Creators
            </p>
            <h1
              id="playbook-hero-heading"
              className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Creator <span className="text-primary">Playbook</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-base">{HERO_DESCRIPTION}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={BECOME_CREATOR_HREF} className={primaryButton}>
                Become a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={HOW_IT_WORKS_HREF} className={darkSecondaryButton}>
                How Hiffi works
              </Link>
            </div>

            <div className="mt-10 max-w-2xl border-t border-white/10 pt-6">
              <PhaseNav items={phaseNavItems} />
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <div className={cn(container, "space-y-12 py-12 sm:space-y-14 sm:py-16")}>
        {/* Phase 01 */}
        <section id="phase-1" aria-labelledby="phase-1-heading" className="scroll-mt-6">
          <PhaseHeader id="phase-1-heading" phase="Phase 01" title="Onboarding & Setup" meta="2 Steps" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:gap-5">
            <PlaybookCard
              headingId="before-you-start"
              eyebrow="Before you start"
              title="Before you start"
              footerLabel="Account Readiness"
              illustration={<ProfileIllustration />}
              glow
            >
              <BulletList>
                <Bullet>
                  You need a Hiffi account —{" "}
                  <Link href="/signup" className={inlineLink}>
                    sign up free
                  </Link>
                  .
                </Bullet>
                <Bullet>
                  Hip-hop and rap artists can <Term>become a creator instantly</Term> after signing up — no waiting
                  period.
                </Bullet>
                <Bullet>
                  Read our{" "}
                  <Link href="/terms-of-use" className={inlineLink}>
                    Terms of Use
                  </Link>{" "}
                  — you must own or have rights to everything you upload.
                </Bullet>
              </BulletList>
            </PlaybookCard>

            <PlaybookCard
              headingId="become-a-creator"
              eyebrow="Step 1"
              title="Become a creator"
              footerLabel="Creator Access"
              illustration={<ProfileIllustration active />}
              glow
            >
              <ol className="space-y-3">
                {[
                  <>Complete your profile with a clear photo and bio.</>,
                  <>
                    Go to{" "}
                    <Link href={BECOME_CREATOR_HREF} className={inlineLink}>
                      Become a Creator
                    </Link>{" "}
                    and unlock creator access instantly — built for hip-hop, rap, and related artists.
                  </>,
                  <>
                    Upload tools open right away in{" "}
                    <Link href="/studio" className={inlineLink}>
                      Hiffi Studio
                    </Link>{" "}
                    and the mobile app.
                  </>,
                ].map((content, index) => (
                  <li key={index} className="flex gap-3">
                    <span
                      className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/[0.08] text-[10px] font-bold text-primary"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span>{content}</span>
                  </li>
                ))}
              </ol>
            </PlaybookCard>
          </div>
        </section>

        {/* Phase 02 */}
        <section id="phase-2" aria-labelledby="phase-2-heading" className="scroll-mt-6">
          <PhaseHeader id="phase-2-heading" phase="Phase 02" title="Strategy & Workflow" meta="Content & Release" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:gap-5">
            <PlaybookCard
              headingId="plan-your-content"
              eyebrow="Programming"
              number="03"
              title="Plan your content"
              footerLabel={
                <span className="inline-flex items-center gap-2 font-medium text-foreground/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                  Recommended release cycle
                </span>
              }
              illustration={<VideoIllustration />}
            >
              <p>
                Think about what role each upload plays on your channel — not every clip needs to be a full music
                video.
              </p>
              <BulletList className="mt-5">
                <Bullet>
                  <Term>Hero content</Term> — Official music videos, album singles, and major releases.
                </Bullet>
                <Bullet>
                  <Term>Hub content</Term> — Freestyles, cyphers, studio sessions, and behind-the-scenes clips.
                </Bullet>
                <Bullet>
                  <Term>Cadence</Term> — Aim for a steady rhythm (e.g., 2–4 weeks) rather than dumping many uploads at
                  once.
                </Bullet>
                <Bullet>
                  <Term>Hiffi vs social</Term> — Post full videos on Hiffi, use Instagram, TikTok, and YouTube Shorts
                  for teasers and drive traffic back.
                </Bullet>
              </BulletList>
            </PlaybookCard>

            <PlaybookCard
              headingId="publishing-optimization"
              eyebrow="Publishing & optimization"
              number="04"
              title="Publishing & optimization"
              footerLabel="Video Encoding Standards"
              illustration={<VideoIllustration lines />}
            >
              <BulletList>
                <Bullet>
                  <Term>Quality</Term> — Use clear audio and stable video. Official music videos in HD perform best on
                  Hiffi.
                </Bullet>
                <Bullet>
                  <Term>Titles</Term> — Use a clear pattern such as{" "}
                  <em className="font-medium text-foreground">Artist Name – Song Title (Official Video)</em>.
                </Bullet>
                <Bullet>
                  <Term>Descriptions</Term> — Include credits, city, release context, and official links.
                </Bullet>
                <Bullet>
                  <Term>Thumbnails</Term> — Use a strong cover image with readable text and a clear focal point.
                </Bullet>
                <Bullet>
                  <Term>Hook early</Term> — The first few seconds matter. Start with your strongest visual or musical
                  moment so viewers stay past the opening.
                </Bullet>
                <Bullet>
                  <Term>Processing</Term> — Videos may show “Processing” briefly after upload. Playback unlocks when
                  processing completes — see the{" "}
                  <Link href="/faq" className={inlineLink}>
                    FAQ
                  </Link>{" "}
                  if a video stays stuck.
                </Bullet>
              </BulletList>
            </PlaybookCard>
          </div>
        </section>

        {/* Phase 03 */}
        <section id="phase-3" aria-labelledby="phase-3-heading" className="scroll-mt-6">
          <PhaseHeader id="phase-3-heading" phase="Phase 03" title="Reach & Distribution" meta="Audience & Growth" />
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:gap-5">
            <PlaybookCard
              headingId="discovery-on-hiffi"
              eyebrow="Discovery on Hiffi"
              number="05"
              title="Discovery on Hiffi"
              footerLabel="Algorithmic Distribution"
              illustration={<TrendIllustration />}
            >
              <BulletList>
                <Bullet>
                  <Term>Following feed</Term> — Fans who follow you see new uploads in their feed.
                </Bullet>
                <Bullet>
                  <Term>Hip-hop hub</Term> — Genre-native surfaces like the{" "}
                  <Link href="/hip-hop" className={inlineLink}>
                    Hip-Hop Hub
                  </Link>{" "}
                  help fans discover new artists.
                </Bullet>
                <Bullet>
                  <Term>Home &amp; recommendations</Term> — Hiffi uses discovery systems to surface relevant content.
                </Bullet>
                <Bullet>
                  <Term>Search &amp; profiles</Term> — A complete profile and descriptive video metadata make it
                  easier for fans to find you by name, song, or subgenre.
                </Bullet>
                <Bullet>
                  <Term>Your profile is your home base</Term> — Lead with your strongest official music video.
                </Bullet>
                <Bullet>
                  <Term>Artist Directory</Term> — A complete artist profile increases your chances of appearing in the{" "}
                  <Link href="/artist-index" className={inlineLink}>
                    Hiffi Artist Directory
                  </Link>{" "}
                  and related discovery pages.
                </Bullet>
              </BulletList>
            </PlaybookCard>

            <PlaybookCard
              headingId="community-growth"
              eyebrow="Discovery on growth"
              number="06"
              title="Community & growth"
              footerLabel="Audience Fan Loop"
              illustration={<ChatIllustration />}
            >
              <BulletList>
                <Bullet>
                  Share <Term>direct watch links</Term> on social — drive fans to a specific video.
                </Bullet>
                <Bullet>
                  <Term>Reply to comments</Term>, especially early on. Repeat engagement turns one-time viewers into
                  followers.
                </Bullet>
                <Bullet>
                  <Term>Collaborate</Term> — Shout out other Hiffi artists, appear in each other&apos;s content, and
                  cross-link profiles where it makes sense.
                </Bullet>
                <Bullet>
                  Keep your <Term>handle and link in bio</Term> consistent across platforms so fans always know where
                  to find your full catalog.
                </Bullet>
                <Bullet>
                  Upload on a <Term>regular schedule</Term> so followers have a reason to come back.
                </Bullet>
              </BulletList>
            </PlaybookCard>
          </div>
        </section>

        {/* Phase 04 */}
        <section id="phase-4" aria-labelledby="phase-4-heading" className="scroll-mt-6">
          <PhaseHeader
            id="phase-4-heading"
            phase="Phase 04"
            title="Pro Standards & Checklist"
            meta="Excellence & Compliance"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <PlaybookCard
              headingId="independent-artist-tips"
              eyebrow="Tips for independent hip-hop artists"
              number="07"
              title="Tips for Independent Hip-Hop Artists"
              footerLabel="Artist Tips"
              illustration={<IconIllustration icon={Lightbulb} />}
              compact
            >
              <p>
                Growing as an independent hip-hop artist takes consistency, quality, and audience engagement. Publish
                official music videos regularly, complete your artist profile, collaborate with other creators, and
                optimize every upload.
              </p>
              <BulletList className="mt-4 space-y-2.5">
                <Bullet>Upload consistently instead of posting many videos at once.</Bullet>
                <Bullet>Complete your artist profile before publishing.</Bullet>
                <Bullet>Engage with fans through comments and follows.</Bullet>
                <Bullet>Collaborate with other independent hip-hop artists.</Bullet>
                <Bullet>Share your Hiffi music videos across social platforms.</Bullet>
              </BulletList>
            </PlaybookCard>

            <PlaybookCard
              headingId="rights-standards"
              eyebrow="Rights & community standards"
              number="08"
              title="Rights & community standards"
              footerLabel="Protection & Terms"
              illustration={<IconIllustration icon={ShieldCheck} />}
              compact
            >
              <p>
                Hiffi is built on respect for artists and fans. Respect copyright, trademarks, and intellectual
                property. Upload only music and videos you own or have permission to publish. No hate speech,
                harassment, or copyright infringement. Full rules are in our{" "}
                <Link href="/terms-of-use" className={inlineLink}>
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/community-guidelines" className={inlineLink}>
                  Community Guidelines
                </Link>
                .
              </p>
            </PlaybookCard>

            <PlaybookCard
              headingId="launch-checklist"
              eyebrow="Launch checklist"
              number="09"
              title="Launch checklist"
              footerLabel="Ready to Publish"
              illustration={<IconIllustration icon={ClipboardList} />}
              compact
              className="border-primary/25 md:col-span-2 lg:col-span-1 dark:border-primary/30"
            >
              <LaunchChecklist items={launchChecklist} labelledBy="launch-checklist" />
            </PlaybookCard>
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-labelledby="playbook-faq-heading" className="pt-2">
          <div className="flex flex-col gap-2 border-b border-black/[0.08] pb-4 dark:border-white/10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">FAQ</p>
              <h2 id="playbook-faq-heading" className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Frequently Asked Questions
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">Everything you need to know about publishing on Hiffi</p>
          </div>
          <div className="mt-6 space-y-3">
            {playbookFaqItems.map((item) => (
              <details
                key={item.question}
                className="group rounded-xl border border-black/[0.07] bg-card transition-colors open:border-primary/40 hover:border-primary/30 dark:border-white/10"
              >
                <summary
                  className={cn(
                    "flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden",
                    focusRing,
                  )}
                >
                  {item.question}
                  <Plus
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-45 group-open:text-primary"
                    aria-hidden
                  />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section
          aria-labelledby="cta-heading"
          className="relative isolate overflow-hidden rounded-3xl bg-[#0b0b0f] text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
        >
          <div
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_130%,rgba(237,28,47,0.45),transparent_60%),radial-gradient(ellipse_at_0%_100%,rgba(237,28,47,0.2),transparent_50%)]"
            aria-hidden
          />
          <div className="flex flex-col gap-7 px-6 py-10 sm:px-10 sm:py-12 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-lg">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Ready to get started?</p>
              <h2 id="cta-heading" className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Join the <span className="text-primary">Hiffi</span> community
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                Whether you&apos;re creating or discovering hip-hop culture.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
              <Link href={BECOME_CREATOR_HREF} className={primaryButton}>
                Become a creator
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={HOW_IT_WORKS_HREF} className={darkSecondaryButton}>
                How Hiffi works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
