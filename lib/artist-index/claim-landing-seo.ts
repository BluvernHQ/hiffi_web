import type { Metadata } from "next"
import { ARTIST_INDEX_CLAIM_PATH, ARTIST_INDEX_PATH, artistIndexCityHref } from "@/lib/artist-directory"
import { absoluteUrl } from "@/lib/seo/site"

export const ARTIST_CLAIM_LANDING_TITLE = "Claim Your Artist Profile on Hiffi"
export const ARTIST_CLAIM_LANDING_DESCRIPTION =
  "Find your Hiffi Artist Index listing, verify your identity, and take control of your bio, links, and music videos. Free for independent hip-hop and rap artists — review in 24–48 hours."

export const ARTIST_CLAIM_STEPS = [
  {
    step: "01",
    title: "Find your profile",
    description:
      "Search the Hiffi Artist Index by stage name or paste your profile URL. 800+ Atlanta hip-hop and rap artists are indexed today — more cities coming.",
    icon: "search" as const,
  },
  {
    step: "02",
    title: "Verify identity",
    description:
      "Submit your claim with official social links or documentation. The Hiffi team reviews applications within 24–48 hours — no login required to start.",
    icon: "shield" as const,
  },
  {
    step: "03",
    title: "Take control",
    description:
      "Update your bio, imagery, and official links. Upload music videos on Hiffi and help fans discover you through the Artist Index and hip-hop hub.",
    icon: "sliders" as const,
  },
] as const

export const ARTIST_CLAIM_FEATURES = [
  {
    title: "Verified artist badge",
    description:
      "Stand out with a verified listing fans can trust. Your profile becomes the canonical Hiffi URL for your name in search and AI answers.",
  },
  {
    title: "Profile & link control",
    description:
      "Fix outdated bios, add Spotify, YouTube, and Instagram links, and keep your directory listing accurate as your career grows.",
  },
  {
    title: "Discovery on Hiffi",
    description:
      "Indexed artists appear in city and genre directories, hip-hop mood hubs, and fan search — built for independent rap culture.",
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
      "verify rapper profile",
      "Hiffi artist claim",
      "claim my music profile",
      "hip-hop artist verification",
      "Atlanta rapper profile",
      "artist index claim",
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
