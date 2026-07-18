import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

const DEFAULT_SITE_NAME = "Hiffi"
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.hiffi.app"
const APP_STORE_URL = "https://apps.apple.com/us/app/hiffi/id6759672725"

export function organizationSchemaId(): string {
  return `${getSiteOrigin()}/#organization`
}

export function webSiteSchemaId(): string {
  return `${getSiteOrigin()}/#website`
}

function parseSameAsUrls(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function uniqueUrls(urls: string[]): string[] {
  return [...new Set(urls.map((s) => s.trim()).filter((s) => s.length > 0))]
}

/**
 * Publisher / brand node for JSON-LD @graph (referenced by @id from pages and VideoObject).
 * Optional env for logo, sameAs, postal address, and geo coordinates (Schema.org Organization).
 */
export function buildOrganizationJsonLd(): Record<string, unknown> {
  const id = organizationSchemaId()
  const origin = getSiteOrigin()
  const name = process.env.NEXT_PUBLIC_ORG_NAME?.trim() || DEFAULT_SITE_NAME

  const logoPath = process.env.NEXT_PUBLIC_ORG_LOGO?.trim()
  const logoUrl = logoPath
    ? logoPath.startsWith("http")
      ? logoPath
      : absoluteUrl(logoPath.startsWith("/") ? logoPath : `/${logoPath}`)
    : absoluteUrl("/hiffi_logo.png")

  const node: Record<string, unknown> = {
    "@type": "Organization",
    "@id": id,
    name,
    url: origin,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
    },
  }

  const legal = process.env.NEXT_PUBLIC_ORG_LEGAL_NAME?.trim()
  if (legal) node.legalName = legal

  const sameAsRaw = process.env.NEXT_PUBLIC_ORG_SAME_AS?.trim()
  const defaultProfiles = [PLAY_STORE_URL, APP_STORE_URL]
  const sameAsUrls = sameAsRaw
    ? uniqueUrls([...parseSameAsUrls(sameAsRaw), ...defaultProfiles])
    : defaultProfiles
  if (sameAsUrls.length) node.sameAs = sameAsUrls

  const street = process.env.NEXT_PUBLIC_ORG_ADDRESS_STREET?.trim()
  const locality = process.env.NEXT_PUBLIC_ORG_ADDRESS_LOCALITY?.trim()
  const region = process.env.NEXT_PUBLIC_ORG_ADDRESS_REGION?.trim()
  const postal = process.env.NEXT_PUBLIC_ORG_ADDRESS_POSTAL_CODE?.trim()
  const country = process.env.NEXT_PUBLIC_ORG_ADDRESS_COUNTRY?.trim()

  if (street || locality || region || postal || country) {
    node.address = {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      ...(locality ? { addressLocality: locality } : {}),
      ...(region ? { addressRegion: region } : {}),
      ...(postal ? { postalCode: postal } : {}),
      ...(country ? { addressCountry: country } : {}),
    }
  }

  const lat = Number.parseFloat(process.env.NEXT_PUBLIC_ORG_GEO_LAT ?? "")
  const lng = Number.parseFloat(process.env.NEXT_PUBLIC_ORG_GEO_LNG ?? "")
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    node.geo = {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    }
  }

  return node
}

/**
 * Sitewide WebSite + Sitelinks SearchBox (SearchAction) when search supports a URL template.
 */
export function buildWebSiteJsonLd(): Record<string, unknown> {
  const origin = getSiteOrigin()
  const name = process.env.NEXT_PUBLIC_ORG_NAME?.trim() || DEFAULT_SITE_NAME

  return {
    "@type": "WebSite",
    "@id": webSiteSchemaId(),
    url: origin,
    name,
    inLanguage: "en",
    publisher: { "@id": organizationSchemaId() },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  }
}

export function buildSitewideJsonLd(): Record<string, unknown> {
  const orgId = organizationSchemaId()
  const name = process.env.NEXT_PUBLIC_ORG_NAME?.trim() || DEFAULT_SITE_NAME

  const androidAppNode: Record<string, unknown> = {
    "@type": "MobileApplication",
    "@id": `${PLAY_STORE_URL}#app`,
    name,
    operatingSystem: "Android",
    applicationCategory: "EntertainmentApplication",
    url: PLAY_STORE_URL,
    publisher: { "@id": orgId },
  }

  const iosAppNode: Record<string, unknown> = {
    "@type": "MobileApplication",
    "@id": `${APP_STORE_URL}#app`,
    name,
    operatingSystem: "iOS",
    applicationCategory: "EntertainmentApplication",
    url: APP_STORE_URL,
    publisher: { "@id": orgId },
  }

  return {
    "@context": "https://schema.org",
    "@graph": [buildOrganizationJsonLd(), buildWebSiteJsonLd(), androidAppNode, iosAppNode],
  }
}
