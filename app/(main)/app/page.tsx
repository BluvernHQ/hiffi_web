import type { Metadata } from "next"
import { cookies } from "next/headers"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { AppDownloadChrome, type PlatformHint } from "@/components/app/app-download-chrome"
import { absoluteUrl } from "@/lib/seo/site"
import { HIFFI_APP_STORE_URL, HIFFI_PLAY_STORE_URL } from "@/lib/app-download"
import {
  ListMusic,
  Music,
  Radio,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  Video,
} from "lucide-react"

const pageTitleAbsolute = "Download Hiffi App — Hip-Hop Music Videos & Creator Streaming"
const pageDescription =
  "Download Hiffi for iOS and Android. Discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream high-quality music."

const pagePath = "/app"
const pageUrl = absoluteUrl(pagePath)

export const metadata: Metadata = {
  title: { absolute: pageTitleAbsolute },
  description: pageDescription,
  keywords: [
    "Hiffi app",
    "download Hiffi",
    "hip-hop streaming app",
    "music video app",
    "Hiffi iOS",
    "Hiffi Android",
    "independent artists",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: pageTitleAbsolute,
    description: pageDescription,
    url: pageUrl,
    type: "website",
    siteName: "Hiffi",
    locale: "en_US",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitleAbsolute,
    description: pageDescription,
    images: [absoluteUrl("/hiffi_logo.png")],
  },
  robots: {
    index: true,
    follow: true,
  },
}

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hiffi",
  operatingSystem: ["iOS", "Android"],
  applicationCategory: "MusicApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  url: pageUrl,
  installUrl: [HIFFI_APP_STORE_URL, HIFFI_PLAY_STORE_URL],
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Hiffi available on iPhone?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — download Hiffi free from the App Store on any iPhone or iPad running iOS.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hiffi available on Android?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — get Hiffi free on Google Play for Android phones and tablets.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hiffi free to download?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, Hiffi is free to download on both iOS and Android.",
      },
    },
    {
      "@type": "Question",
      name: "Can artists upload videos on Hiffi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — artists can upload music videos, build a creator profile, and grow their audience directly on Hiffi.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hiffi for hip-hop and rap artists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. Hiffi is built specifically for the hip-hop and rap community — both artists and fans.",
      },
    },
  ],
}

const fanFeatures = [
  {
    icon: Music,
    title: "Discover artists",
    description: "Find new hip-hop and rap artists you have not heard yet.",
  },
  {
    icon: Video,
    title: "Watch music videos",
    description: "Stream official music videos from independent creators.",
  },
  {
    icon: UserRound,
    title: "Follow creators",
    description: "Stay updated on your favourite artists.",
  },
  {
    icon: ListMusic,
    title: "Build playlists",
    description: "Organise your music exactly how you want it.",
  },
  {
    icon: Radio,
    title: "High-quality streaming",
    description: "Crystal-clear audio and video, wherever you are.",
  },
] as const

const artistFeatures = [
  {
    icon: Upload,
    title: "Upload videos",
    description: "Share your music videos directly with fans.",
  },
  {
    icon: Users,
    title: "Reach fans",
    description: "Build an audience that genuinely cares about your music.",
  },
  {
    icon: UserRound,
    title: "Creator profile",
    description: "Your own space on Hiffi to represent your brand.",
  },
  {
    icon: TrendingUp,
    title: "Grow visibility",
    description: "Get discovered by listeners looking for new sounds.",
  },
] as const

const appFeaturePills = [
  "Music video discovery",
  "Creator profiles",
  "Playlists",
  "Follow artists",
  "High-quality streaming",
  "iOS & Android support",
] as const

export default async function AppDownloadPage() {
  const cookieStore = await cookies()
  const cookiePlatform = cookieStore.get("hiffi_platform")?.value
  const initialPlatform: PlatformHint =
    cookiePlatform === "ios" || cookiePlatform === "android" ? cookiePlatform : "unknown"

  return (
    <div className="relative min-h-full bg-[#f3f0e8] text-[#121212]">
      <JsonLd data={softwareJsonLd} />
      <JsonLd data={faqJsonLd} />

      <AppDownloadChrome initialPlatform={initialPlatform}>
        <div className="relative z-[1]">
          <section className="relative mx-auto max-w-6xl border-t border-black/15 px-4 py-20 text-center sm:px-6 md:py-28 lg:px-8">
            <p
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none text-[clamp(4rem,12vw,9rem)] font-black uppercase tracking-[-0.04em] text-black/[0.05]"
            >
              HIPHOP
            </p>
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]">What is Hiffi?</h2>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-black/80 md:text-xl">
              Hiffi is a music and video streaming platform built for independent creators, hip-hop artists, and their
              fans. Whether you&apos;re an artist ready to share your work or a fan looking for new sounds, Hiffi
              connects you directly.
            </p>
          </section>

          <section className="border-t border-black/15 bg-[#efebdf] py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]">For fans</h2>
              <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:gap-5 xl:grid-cols-3">
                {fanFeatures.map(({ icon: Icon, title, description }, idx) => (
                  <article
                    key={title}
                    className={`border-2 border-black p-5 md:p-6 ${idx % 3 === 1 ? "-rotate-[0.8deg] bg-[#fffdf8]" : idx % 3 === 2 ? "rotate-[0.7deg] bg-[#f7e4e8]" : "bg-[#f9f6ed]"} shadow-[6px_6px_0_#111]`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-[#DA291C] text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-semibold uppercase tracking-tight text-black">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black/80">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-black/15 py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]">
                For artists
              </h2>
              <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {artistFeatures.map(({ icon: Icon, title, description }, idx) => (
                  <article
                    key={title}
                    className={`border-2 border-black p-5 md:p-6 ${idx % 2 === 0 ? "bg-[#fffdf8]" : "bg-[#f6f3ea]"} shadow-[6px_6px_0_#111] ${idx === 1 ? "rotate-[0.8deg]" : idx === 2 ? "-rotate-[0.6deg]" : ""}`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center border-2 border-black bg-black text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="mt-4 text-base font-semibold uppercase tracking-tight text-black">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-black/80">{description}</p>
                  </article>
                ))}
              </div>
              <p className="mt-10 text-sm text-black/75">
                On the web?{" "}
                <Link href="/creator/apply" className="font-semibold text-[#DA291C] hover:underline">
                  Become a creator
                </Link>
                .
              </p>
            </div>
          </section>

          <section className="border-t border-black/15 bg-[#ece8dd] py-20 md:py-28">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]">
                App features
              </h2>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                {appFeaturePills.map((label) => (
                  <span
                    key={label}
                    className="inline-flex border-2 border-black bg-[#fffdf8] px-4 py-2.5 text-sm font-semibold uppercase tracking-wide text-black shadow-[4px_4px_0_#111]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-black/15 py-20 md:py-24">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
              <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#DA291C]">
                Frequently asked questions
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-black/75">
                Answers about the app, devices, pricing, and creators live on our FAQ — same topics search engines pick
                up from this page&apos;s structured data, with full detail in one place.
              </p>
              <Link
                href="/faq#app-and-downloads"
                className="mt-8 inline-flex border-2 border-black bg-black px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-[6px_6px_0_#DA291C] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[5px_5px_0_#DA291C]"
              >
                Open FAQ
              </Link>
            </div>
          </section>
        </div>
      </AppDownloadChrome>
    </div>
  )
}
