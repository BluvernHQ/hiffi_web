import type { Metadata } from "next"
import { ARTIST_INDEX_CLAIM_PATH, ARTIST_INDEX_PATH, artistIndexCityHref } from "@/lib/artist-directory"
import { absoluteUrl } from "@/lib/seo/site"

export const ARTIST_CLAIM_LANDING_TITLE = "Claim Your Artist Profile on Hiffi"
export const ARTIST_CLAIM_LANDING_DESCRIPTION =
  "Claim your free artist profile on Hiffi. Find your listing, verify identity (review in 24–48 hours), update bio and links, and manage music videos as an independent hip-hop artist."

export const ARTIST_CLAIM_STEPS = [
  {
    step: "01",
    title: "Find your profile",
    description:
      "Search our extensive HIFFI database using your stage name or existing profile URL to locate your public artist page.",
    icon: "step-find" as const,
  },
  {
    step: "02",
    title: "Verify identity",
    description:
      "Provide your official social media links or valid documentation. Our team reviews applications within 24–48 hours.",
    icon: "step-verify" as const,
  },
  {
    step: "03",
    title: "Take control",
    description:
      "Access your dashboard to update your bio, link your latest music videos, and view detailed streaming analytics.",
    icon: "step-control" as const,
  },
] as const

export const ARTIST_CLAIM_FEATURES = [
  {
    title: "Analytics Dashboard",
    description:
      "Deep dive into listener demographics and track performance.",
  },
  {
    title: "Content Control",
    description:
      "Pin your latest releases and curate your video catalog.",
  },
  {
    title: "Industry Network",
    description:
      "Get discovered by top-tier producers and major label scouts.",
  },
] as const

export const ARTIST_CLAIM_FAQ = [
  {
    question: "How do I claim my artist profile on Hiffi?",
    answer:
      "Search your stage name on the Artist Index or open your existing profile URL, then select Claim your profile. Submit your details for review — most claims are processed within 24–48 hours.",
  },
  {
    question: "Is claiming my Hiffi profile free?",
    answer:
      "Yes. Claiming your Artist Index listing is free. Verification unlocks profile edits; uploading music videos uses Hiffi's standard creator tools.",
  },
  {
    question: "What if I am not listed in the Artist Index yet?",
    answer:
      "The index is growing city by city, starting with 800+ Atlanta artists. Apply as a Hiffi creator to publish videos, or contact support if you believe you should be indexed.",
  },
  {
    question: "Does claiming upload my music automatically?",
    answer:
      "No. Claiming verifies your identity and unlocks profile controls. You choose what videos and updates go live on Hiffi.",
  },
] as const

export function buildArtistClaimLandingMetadata(): Metadata {
  const url = absoluteUrl(ARTIST_INDEX_CLAIM_PATH)

  return {
    title: ARTIST_CLAIM_LANDING_TITLE,
    description: ARTIST_CLAIM_LANDING_DESCRIPTION,
    keywords: [
      "claim artist profile",
      "claim artist profile Hiffi",
      "artist profile claim",
      "claim rapper profile",
      "verify rapper profile",
      "Hiffi artist claim",
      "claim my music profile",
      "hip-hop artist verification",
      "Atlanta rapper profile",
      "artist index claim",
      "creator profile",
      "independent artist profile",
    ],
    alternates: { canonical: url },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" as const },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Hiffi",
      title: `${ARTIST_CLAIM_LANDING_TITLE} | Hiffi`,
      description: ARTIST_CLAIM_LANDING_DESCRIPTION,
      images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi Artist Central" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${ARTIST_CLAIM_LANDING_TITLE} | Hiffi`,
      description: ARTIST_CLAIM_LANDING_DESCRIPTION,
      images: [absoluteUrl("/hiffi_logo.png")],
    },
  }
}

export function buildArtistClaimLandingJsonLd(artistCount?: number) {
  const pageUrl = absoluteUrl(ARTIST_INDEX_CLAIM_PATH)
  const countLabel = artistCount != null && artistCount > 0 ? artistCount.toLocaleString() : "800"
  const origin = absoluteUrl("/").replace(/\/$/, "")

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: ARTIST_CLAIM_LANDING_TITLE,
        description: ARTIST_CLAIM_LANDING_DESCRIPTION,
        inLanguage: "en",
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${origin}/#organization` },
        mainEntity: { "@id": `${pageUrl}#howto` },
      },
      {
        "@type": "HowTo",
        "@id": `${pageUrl}#howto`,
        name: "How to claim your artist profile on Hiffi",
        description: `Find your listing among ${countLabel}+ indexed artists, verify your identity, and manage your profile.`,
        step: ARTIST_CLAIM_STEPS.map((item, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: item.title,
          text: item.description,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: ARTIST_CLAIM_FAQ.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Artist Index",
            item: absoluteUrl(ARTIST_INDEX_PATH),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Claim profile",
            item: pageUrl,
          },
        ],
      },
    ],
  }
}

export function getArtistClaimAtlantaHref(): string {
  return artistIndexCityHref("atlanta")
}
