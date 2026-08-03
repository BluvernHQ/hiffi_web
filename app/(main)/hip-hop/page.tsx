import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { MOODS } from "@/lib/mood-tabs"
import { CreatorDestinationLink } from "@/components/creator/creator-destination-link"

const pageTitle = "Hip-Hop Music Videos & Streaming — Discover Independent Rap Artists"
const pageDescription =
  "Hiffi is the hip-hop-first platform for independent rap artists and fans. Watch official music videos, discover drill, trap, conscious rap, boom bap, and more."
const pageUrl = absoluteUrl("/hip-hop")

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "hip hop streaming",
    "rap music videos",
    "independent hip hop artists",
    "underground rap streaming",
    "drill music",
    "trap music",
    "conscious rap",
    "boom bap streaming",
    "hip hop music video platform",
    "best platform for independent hip hop artists",
    "where to watch rap music videos",
    "hip hop app",
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
      "Hiffi hosts official music videos from independent hip-hop and rap artists worldwide. Browse the discover feed at hiffi.com, search by artist name or vibe, or explore mood-based hubs covering drill, trap, conscious rap, boom bap, lo-fi hip-hop, and more — a dedicated place to watch rap music videos online outside generic video feeds.",
  },
  {
    question: "Does Hiffi have drill and trap music?",
    answer:
      "Yes. Hiffi features a dedicated drill and trap mood called On Sight — covering hard-hitting drill beats, trap bangers, and rage rap. Independent artists in the drill and trap scenes upload official videos directly to the platform; fans can also search for UK drill-style energy, Southern trap, and underground trap rap in one hip-hop-native home.",
  },
  {
    question: "Is there a hip-hop streaming app for iPhone and Android?",
    answer:
      "Yes. The Hiffi app is free to download on both iOS (App Store) and Android (Google Play). Discover new hip-hop artists, watch music videos, follow creators, build playlists, and stream in high quality on your phone — built as a hip-hop streaming app, not a general video app with a rap filter.",
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
        url: absoluteUrl(`/hip-hop/mood/${encodeURIComponent(mood.query.replace(/\s+/g, "-").toLowerCase())}`),
        name: `${mood.label} — ${mood.vibe}`,
      })),
    },
  ],
}

export default function HipHopPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={hubJsonLd} />

      {/* Hero */}
      <section className="mb-12">
        <h1 className="font-bebas text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-4">
          Hip-Hop Music Videos &amp; Streaming
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Stream independent hip-hop music videos, discover emerging rap artists, and explore drill, trap, boom bap, conscious rap, and more on Hiffi's artist-first streaming platform.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/artist-index/city/atlanta"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Discover Artists
          </Link>
          <CreatorDestinationLink
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Upload Your Music
          </CreatorDestinationLink>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Get the App
          </Link>
        </div>
      </section>

      {/* Mood sections */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2">Browse by Vibe</h2>
        <p className="text-muted-foreground mb-6">
          Hip-hop-native moods — culture-first vibe hubs for drill, trap, conscious rap, and more.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOODS.map((mood) => {
            const slug = mood.query.replace(/\s+/g, "-").toLowerCase()
            return (
              <Link
                key={mood.query}
                href={`/hip-hop/mood/${encodeURIComponent(slug)}`}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 hover:border-primary/60 transition-all hover:-translate-y-0.5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {mood.cluster}
                  </span>
                </div>
                <h3 className="text-lg font-bold leading-tight mb-1">{mood.label}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{mood.vibe}</p>
                <p className="mt-2 text-xs text-muted-foreground/70 italic">{mood.tagline}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Artist Index */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2">Discover Atlanta Hip-Hop Artists</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl leading-relaxed">
          Browse 800+ emerging Atlanta rap and hip-hop profiles on the Hiffi Artist Index — claimable
          listings with official links, genre tags, and paths to music videos on Hiffi.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/artist-index/city/atlanta"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse 800+ Atlanta artists
          </Link>
          <Link
            href="/artist-index"
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Full Artist Index
          </Link>
        </div>
      </section>

      {/* Why Hiffi for hip-hop */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold mb-2">Why Hip-Hop Artists Choose Hiffi</h2>
        <p className="text-muted-foreground mb-6">
          Hip-hop accounts for the largest share of global music streams — but most platforms
          are built for everyone, which means they&apos;re optimized for no one. Hiffi is
          different.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            {
              title: "Hip-Hop First Audience",
              body: "Every fan on Hiffi came for hip-hop and rap. Your music videos reach people who are already looking for the genre — not a general audience that scrolls past.",
            },
            {
              title: "Official Music Videos",
              body: "Upload HD music videos and keep them as official releases. High-fidelity playback — lossless audio, high-quality video — the standard your art deserves.",
            },
            {
              title: "Creator Control",
              body: "Manage your profile, upload and edit content, and build your audience directly. No label required. Independent artists keep creative ownership.",
            },
            {
              title: "Discoverability",
              body: "Genre-based discovery through mood mixes, artist profiles, and curated hip-hop collections helps fans find your music.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subgenre quick links */}
      <section id="hip-hop-subgenres" className="mb-14 scroll-mt-20">
        <h2 className="text-2xl font-bold mb-4">Hip-Hop Subgenres on Hiffi</h2>
         <p className="mb-5 max-w-3xl text-muted-foreground">
             Explore hip-hop music by subgenre on Hiffi. Discover independent artists, official music videos, and new releases across every style.
         </p>
        <div className="flex flex-wrap gap-2">
          {[
            "Drill", "Trap", "Conscious Rap", "Boom Bap", "Lo-fi Hip-Hop",
            "Rage Rap", "Melodic Rap", "Underground Rap", "Lyrical Rap", "East Coast Rap",
            "West Coast Rap", "Southern Hip-Hop", "UK Drill", "Afro Trap",
          ].map((genre) => (
            <Link
              key={genre}
              href={`/search?q=${encodeURIComponent(genre.toLowerCase())}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              {genre}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqItems.map((item) => (
            <div key={item.question} className="border-b border-border pb-6 last:border-0">
              <h3 className="font-semibold mb-2">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="hip-hop-cta" className="mb-14 scroll-mt-20 rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to drop your next video?</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Join independent hip-hop artists already publishing on Hiffi. Upload your official music
          videos and start building your audience today.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <CreatorDestinationLink
            className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Become a Creator
          </CreatorDestinationLink>
          <Link
            href="/app"
            className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Download App
          </Link>
        </div>
      </section>
    </main>
  )
}
