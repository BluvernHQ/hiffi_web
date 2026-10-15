import { HIFFI_APP_STORE_URL, HIFFI_PLAY_STORE_URL } from "@/lib/app-download"
import { ORGANIZATION_SAME_AS } from "@/lib/seo/social"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

const DEFAULT_SITE_NAME = "Hiffi"

export function organizationSchemaId(): string {
  return `${getSiteOrigin()}/#organization`
}

export function webSiteSchemaId(): string {
  return `${getSiteOrigin()}/#website`
}

export function iosAppSchemaId(): string {
  return `${HIFFI_APP_STORE_URL}#app`
}

export function androidAppSchemaId(): string {
  return `${HIFFI_PLAY_STORE_URL}#app`
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
  const sameAsUrls = sameAsRaw
    ? uniqueUrls([...ORGANIZATION_SAME_AS, ...parseSameAsUrls(sameAsRaw)])
    : [...ORGANIZATION_SAME_AS]
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

function freeOffer() {
  return {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  }
}

/** iOS + Android MobileApplication nodes linked to Organization. */
export function buildMobileApplicationJsonLdNodes(): Record<string, unknown>[] {
  const orgId = organizationSchemaId()
  const name = process.env.NEXT_PUBLIC_ORG_NAME?.trim() || DEFAULT_SITE_NAME
  const downloadPage = absoluteUrl("/app")

  return [
    {
      "@type": "MobileApplication",
      "@id": androidAppSchemaId(),
      name,
      operatingSystem: "Android",
      applicationCategory: "MusicApplication",
      url: HIFFI_PLAY_STORE_URL,
      downloadUrl: HIFFI_PLAY_STORE_URL,
      installUrl: HIFFI_PLAY_STORE_URL,
      sameAs: [downloadPage],
      offers: freeOffer(),
      publisher: { "@id": orgId },
    },
    {
      "@type": "MobileApplication",
      "@id": iosAppSchemaId(),
      name,
      operatingSystem: "iOS",
      applicationCategory: "MusicApplication",
      url: HIFFI_APP_STORE_URL,
      downloadUrl: HIFFI_APP_STORE_URL,
      installUrl: HIFFI_APP_STORE_URL,
      sameAs: [downloadPage],
      offers: freeOffer(),
      publisher: { "@id": orgId },
    },
  ]
}

export function buildSitewideJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationJsonLd(),
      buildWebSiteJsonLd(),
      ...buildMobileApplicationJsonLdNodes(),
    ],
  }
}
