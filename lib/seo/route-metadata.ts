import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/seo/site"

const SITE_NAME = "Hiffi"

/**
 * Standard metadata for App Router segments (used from route layout.tsx).
 * Title merges with root `title.template` (`%s | Hiffi`).
 */
export function routeMetadata(opts: {
  /** Short segment title; becomes `{title} | Hiffi` via root template */
  title: string
  description: string
  path: string
  /** Default true. Use false for auth, personalized, or internal surfaces */
  index?: boolean
}): Metadata {
  const { title, description, path, index = true } = opts
  const url = absoluteUrl(path)
  const ogImage = { url: absoluteUrl("/hiffi_logo.png"), alt: SITE_NAME }

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" as const },
        }
      : { index: false, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [absoluteUrl("/hiffi_logo.png")],
    },
  }
}
