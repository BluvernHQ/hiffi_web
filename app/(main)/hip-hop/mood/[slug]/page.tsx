import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"
import { MOODS, type MoodDef } from "@/lib/mood-tabs"

type Props = { params: Promise<{ slug: string }> }

function moodFromSlug(slug: string): MoodDef | undefined {
  const decoded = decodeURIComponent(slug).toLowerCase()
  return MOODS.find(
    (m) =>
      m.query.replace(/\s+/g, "-").toLowerCase() === decoded ||
      m.query.toLowerCase() === decoded,
  )
}

export async function generateStaticParams() {
  return MOODS.map((mood) => ({
    slug: mood.query.replace(/\s+/g, "-").toLowerCase(),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const mood = moodFromSlug(slug)
  if (!mood) return { title: "Not found", robots: { index: false, follow: false } }

  const pageUrl = absoluteUrl(`/hip-hop/mood/${encodeURIComponent(slug)}`)
  const title = `${mood.label} — ${mood.vibe} | Hiffi Hip-Hop`
  const description = `Discover ${mood.vibe} music videos from independent hip-hop artists on Hiffi. ${mood.tagline} Stream the best ${mood.cluster.toLowerCase()} rap — no algorithms.`

  return {
    title,
    description,
    keywords: [
      mood.vibe,
      mood.cluster,
      "hip hop",
      "rap music videos",
      "independent hip hop",
      `${mood.label.toLowerCase()} playlist`,
      `${mood.cluster.toLowerCase()} rap`,
      "hiffi",
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "Hiffi",
      locale: "en_US",
      images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: `${mood.label} — Hiffi` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/hiffi_logo.png")],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  }
}

export default async function MoodPage({ params }: Props) {
  const { slug } = await params
  const mood = moodFromSlug(slug)
  if (!mood) notFound()

  const pageUrl = absoluteUrl(`/hip-hop/mood/${encodeURIComponent(slug)}`)
  const title = `${mood.label} — ${mood.vibe}`
  const description = `Discover ${mood.vibe} music videos from independent hip-hop artists on Hiffi. ${mood.tagline} Stream the best ${mood.cluster.toLowerCase()} rap — no algorithms.`

  const otherMoods = MOODS.filter((m) => m.query !== mood.query)

  const faqItems = [
    {
      question: `What is ${mood.label} on Hiffi?`,
      answer: `${mood.label} is Hiffi's ${mood.cluster.toLowerCase()} hip-hop mood — featuring ${mood.vibe}. ${mood.tagline} Find independent artists releasing music videos in this style on Hiffi.`,
    },
    {
      question: `Where can I stream ${mood.vibe} online?`,
      answer: `Hiffi hosts independent hip-hop music videos in the ${mood.vibe} style under the ${mood.label} mood. Browse the ${mood.label} section on Hiffi to discover new artists and official videos in this subgenre.`,
    },
    {
      question: `Can independent rap artists upload ${mood.cluster.toLowerCase()} music to Hiffi?`,
      answer: `Yes. Independent hip-hop artists making ${mood.vibe} can apply to become a Hiffi creator and upload official music videos. Hiffi is built for independent artists — no label required.`,
    },
  ]

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        inLanguage: "en",
        isPartOf: { "@id": `${getSiteOrigin()}/#website` },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Hip-Hop", item: absoluteUrl("/hip-hop") },
            { "@type": "ListItem", position: 2, name: mood.label, item: pageUrl },
          ],
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        url: pageUrl,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
      {
        "@type": "MusicPlaylist",
        "@id": `${pageUrl}#playlist`,
        url: pageUrl,
        name: `${mood.label} — ${mood.vibe}`,
        description,
        genre: mood.vibe,
      },
    ],
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <JsonLd data={pageJsonLd} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        <span>/</span>
        <Link href="/hip-hop" className="hover:text-foreground transition-colors">Hip-Hop</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{mood.label}</span>
      </nav>

      {/* Hero */}
      <section className="mb-12">
        <div className="mb-2">
          <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {mood.cluster}
          </span>
        </div>
        <h1 className="font-bebas text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-3">
          {mood.label}
        </h1>
        <p className="text-xl text-muted-foreground mb-1">{mood.vibe}</p>
        <p className="text-lg italic text-muted-foreground/70 mb-6">{mood.tagline}</p>
        <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
          Discover independent hip-hop artists making {mood.vibe} music videos on Hiffi.
          The only platform built hip-hop first — no algorithmic gatekeeping, just the culture.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/search?q=${encodeURIComponent(mood.vibe)}`}
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Search {mood.label} Videos
          </Link>
          <Link
            href="/creator/apply"
            className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
          >
            Upload Your Music
          </Link>
        </div>
      </section>

      {/* About this vibe */}
      <section className="mb-12 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold mb-3">About {mood.label}</h2>
        <p className="text-muted-foreground leading-relaxed">
          {mood.label} covers the {mood.cluster.toLowerCase()} side of hip-hop — {mood.vibe}.
          On Hiffi, independent artists in this lane upload official music videos and connect
          directly with fans who live for this sound. From first-time uploads to established
          independent acts, {mood.label} is where you find the realest {mood.cluster.toLowerCase()} rap.
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-5">Frequently Asked Questions</h2>
        <div className="space-y-5">
          {faqItems.map((item) => (
            <div key={item.question} className="border-b border-border pb-5 last:border-0">
              <h3 className="font-semibold mb-1.5">{item.question}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Other moods */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">More Hip-Hop Moods</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {otherMoods.map((m) => {
            const otherSlug = m.query.replace(/\s+/g, "-").toLowerCase()
            return (
              <Link
                key={m.query}
                href={`/hip-hop/mood/${encodeURIComponent(otherSlug)}`}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/60 transition-all hover:-translate-y-0.5"
              >
                <p className="font-semibold text-sm mb-0.5">{m.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{m.vibe}</p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Back */}
      <div>
        <Link
          href="/hip-hop"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Hip-Hop Hub
        </Link>
      </div>
    </main>
  )
}
