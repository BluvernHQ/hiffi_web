import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Geist, Geist_Mono, Bebas_Neue, DM_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { GuestConversionProvider } from '@/components/conversion/guest-conversion-provider'
import { SidebarProvider } from '@/lib/sidebar-context'
import { VideoUploadQueueProvider } from '@/lib/video-upload-queue-context'
import { VideoProvider } from '@/lib/video-context'
import { Toaster } from '@/components/ui/toaster'
import { ApiAnalyticsShell } from '@/components/analytics/api-analytics-shell'
import { ThirdPartyAnalyticsShell } from '@/components/analytics/third-party-analytics-shell'
import { AnalyticsRouteGuard } from '@/components/analytics/analytics-route-guard'
import { getSiteOrigin, absoluteUrl } from '@/lib/seo/site'
import { ORGANIZATION_SAME_AS } from '@/lib/seo/social'
import { JsonLd } from '@/components/seo/json-ld'
import { UtmPoll } from '@/components/marketing/utm-poll'
import { DeployStaleGuard } from '@/components/deploy/deploy-stale-guard'
import { getAnalyticsAppVersion } from '@/lib/app-version'
import { getApiBaseUrl } from '@/lib/config'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-sans" })
const _geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-mono" })
const _bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], display: "swap", variable: "--font-bebas" })
const _dmSans = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-dm-sans" })

const SITE_NAME = "Hiffi"
const SITE_DESCRIPTION =
  "Hiffi is a hip-hop-first music and video streaming platform for independent rap artists and fans. Discover music videos, follow creators, and stream in high quality — no algorithmic interference."

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${SITE_NAME} — Hip-Hop Music Videos & Streaming for Independent Artists`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "hip hop streaming",
    "rap music videos",
    "independent hip hop artists",
    "underground rap streaming",
    "drill music",
    "trap music",
    "conscious rap",
    "boom bap",
    "hip hop music video platform",
    "independent rap artists",
    "hiffi",
    "music video platform",
    "lossless audio",
    "creator platform",
  ],
  authors: [{ name: "Hiffi", url: getSiteOrigin() }],
  creator: "Hiffi",
  publisher: "Hiffi",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: getSiteOrigin(),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteOrigin(),
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Hip-Hop Music Videos & Streaming`,
    description: SITE_DESCRIPTION,
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Hip-Hop Music Videos & Streaming`,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/hiffi_logo.png")],
  },
  icons: {
    icon: [{ url: "/hiffi_logo.png", type: "image/png" }],
    apple: "/hiffi_logo.png",
  },
}

// Single @graph with cross-referenced @id nodes — the preferred pattern per schema.org spec.
// WebSite.publisher → references Organization by @id (no data duplication).
// Organization.logo must be ImageObject per Google's requirements.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${getSiteOrigin()}/#website`,
      url: getSiteOrigin(),
      name: SITE_NAME,
      description: "Hip-hop-first music and video streaming platform for independent rap artists and fans.",
      inLanguage: "en",
      // publisher cross-references Organization by @id — no duplicate data
      publisher: { "@id": `${getSiteOrigin()}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${getSiteOrigin()}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${getSiteOrigin()}/#organization`,
      name: SITE_NAME,
      url: getSiteOrigin(),
      description: SITE_DESCRIPTION,
      inLanguage: "en",
      logo: {
        "@type": "ImageObject",
        "@id": `${getSiteOrigin()}/#logo`,
        url: absoluteUrl("/hiffi_logo.png"),
        width: 512,
        height: 512,
        caption: SITE_NAME,
      },
      image: { "@id": `${getSiteOrigin()}/#logo` },
      // GEO / E-E-A-T: single canonical Organization — referenced by FAQ, profiles, and VideoObject.
      knowsAbout: [
        "Hip hop music",
        "Rap music",
        "Drill music",
        "Trap music",
        "Conscious rap",
        "Boom bap",
        "Lo-fi hip-hop",
        "Independent music",
        "Music video streaming",
        "Lossless audio streaming",
      ],
      areaServed: ["US", "IN", "Worldwide"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "care@hiffi.com",
        availableLanguage: ["English"],
      },
      sameAs: ORGANIZATION_SAME_AS,
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const appEnv = process.env.NEXT_PUBLIC_ENV || "beta"
  const isProd = appEnv === "prod"
  const isBeta = appEnv === "beta"
  // Beta-only Umami website id (performance only; no replay)
  const umamiWebsiteId = isBeta
    ? "c4c06e01-881a-4dcc-9357-969c56942952"
    : process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiPerformanceEnabled =
    process.env.NEXT_PUBLIC_UMAMI_PERFORMANCE !== "false" &&
    process.env.NEXT_PUBLIC_UMAMI_PERFORMANCE !== "0"
  const umamiReplayEnabled =
    process.env.NEXT_PUBLIC_UMAMI_REPLAY_ENABLED !== "false" &&
    process.env.NEXT_PUBLIC_UMAMI_REPLAY_ENABLED !== "0"
  const umamiDomains =
    process.env.NEXT_PUBLIC_UMAMI_DOMAINS ||
    (isBeta ? "dev.hiffi.com" : "hiffi.com,www.hiffi.com")
  const apiAnalyticsEnabled =
    process.env.NEXT_PUBLIC_API_ANALYTICS === "true" || process.env.NEXT_PUBLIC_API_ANALYTICS === "1"
  const apiAnalyticsBaseUrl = getApiBaseUrl().replace(/\/$/, "")
  // Serve tracker via same-origin proxy so autocapture can route through wrapped capture().
  const apiAnalyticsSrc = apiAnalyticsEnabled ? "/proxy/tracker.js" : null
  const analyticsIngestKey = process.env.NEXT_PUBLIC_ANALYTICS_INGEST_KEY || null
  const analyticsAppVersion = getAnalyticsAppVersion()

  return (
    <html lang="en" className={`${_geist.variable} ${_geistMono.variable} ${_bebasNeue.variable} ${_dmSans.variable}`}>
      <head>
        <JsonLd data={siteJsonLd} />
        {/* First-party + third-party analytics load client-side; skipped on /admin routes */}
        <Suspense fallback={null}>
          <AnalyticsRouteGuard gaId={gaId} />
        </Suspense>
        {apiAnalyticsSrc && (
          <Suspense fallback={null}>
            <ApiAnalyticsShell
              src={apiAnalyticsSrc}
              baseUrl={apiAnalyticsBaseUrl}
              ingestKey={analyticsIngestKey}
              appVersion={analyticsAppVersion}
            />
          </Suspense>
        )}
        <Suspense fallback={null}>
          <ThirdPartyAnalyticsShell
            clarityId={clarityId}
            gaId={gaId}
            umamiWebsiteId={umamiWebsiteId}
            umamiDomains={umamiDomains}
            umamiPerformanceEnabled={umamiPerformanceEnabled}
            umamiReplayEnabled={umamiReplayEnabled}
            isProd={isProd}
            isBeta={isBeta}
          />
        </Suspense>
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <GuestConversionProvider>
            <VideoProvider>
              <SidebarProvider>
                <VideoUploadQueueProvider>{children}</VideoUploadQueueProvider>
              </SidebarProvider>
            </VideoProvider>
          </GuestConversionProvider>
        </AuthProvider>
        <Toaster />
        <Suspense fallback={null}>
          <UtmPoll />
        </Suspense>
        <Suspense fallback={null}>
          <DeployStaleGuard />
        </Suspense>
      </body>
    </html>
  )
}
