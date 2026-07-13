import type { Metadata } from "next"
import { absoluteUrl } from "@/lib/seo/site"

type AtlantaMetadataInput = {
  title: string
  description: string
  path: string
  keywords?: string[]
}

export function buildAtlantaMetadata({
  title,
  description,
  path,
  keywords,
}: AtlantaMetadataInput): Metadata {
  const pageUrl = absoluteUrl(path)
  const absoluteTitle = `${title} | Hiffi`

  return {
    title: { absolute: absoluteTitle },
    description,
    keywords,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      url: pageUrl,
      title: absoluteTitle,
      description,
      siteName: "Hiffi",
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle,
      description,
    },
  }
}
