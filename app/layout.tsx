import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth-context'
import { SidebarProvider } from '@/lib/sidebar-context'
import { VideoUploadQueueProvider } from '@/lib/video-upload-queue-context'
import { VideoProvider } from '@/lib/video-context'
import { Toaster } from '@/components/ui/toaster'
import { ClarityTracker } from '@/components/analytics/clarity-tracker'
import { GATracker } from '@/components/analytics/ga-tracker'
import { ApiAnalyticsTracker } from '@/components/analytics/api-analytics-tracker'
import { getSiteOrigin, absoluteUrl } from '@/lib/seo/site'
import { JsonLd } from '@/components/seo/json-ld'
import { API_BASE_URL } from '@/lib/config'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

const SITE_NAME = "Hiffi"
const SITE_DESCRIPTION =
  "Hiffi is a creator-first, high-fidelity video and lossless audio streaming platform for independent artists. Discover, stream, and support creators without algorithmic interference."

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: `${SITE_NAME} — High-Fidelity Streaming for Creators`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "high fidelity streaming",
    "lossless audio",
    "independent artists",
    "creator platform",
    "music videos",
    "video streaming",
    "hiffi",
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
    title: `${SITE_NAME} — High-Fidelity Streaming for Creators`,
    description: SITE_DESCRIPTION,
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — High-Fidelity Streaming for Creators`,
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
      description: SITE_DESCRIPTION,
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
      areaServed: ["US", "IN", "Worldwide"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "care@hiffi.com",
        availableLanguage: ["English"],
      },
      // sameAs: add official social profile URLs here when available
      // e.g. "https://twitter.com/hiffi", "https://instagram.com/hiffi"
      sameAs: [],
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
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiReplayEnabled =
    process.env.NEXT_PUBLIC_UMAMI_REPLAY_ENABLED !== "false" &&
    process.env.NEXT_PUBLIC_UMAMI_REPLAY_ENABLED !== "0"
  const umamiDomains = process.env.NEXT_PUBLIC_UMAMI_DOMAINS || "hiffi.com,dev.hiffi.com,localhost"
  const apiAnalyticsEnabled =
    process.env.NEXT_PUBLIC_API_ANALYTICS === "true" || process.env.NEXT_PUBLIC_API_ANALYTICS === "1"
  const apiAnalyticsSrc = apiAnalyticsEnabled
    ? `${API_BASE_URL.replace(/\/$/, "")}/tracker.js`
    : null
  const analyticsIngestKey = process.env.NEXT_PUBLIC_ANALYTICS_INGEST_KEY || null
  const analyticsAppVersion = process.env.NEXT_PUBLIC_APP_VERSION || "web-nextjs"
  const isProd = process.env.NEXT_PUBLIC_ENV === "prod"

  return (
    <html lang="en">
      <head>
        <JsonLd data={siteJsonLd} />
        {/* Microsoft Clarity - ID from env only, never in source */}
        {clarityId && (
          <Script
            id="microsoft-clarity"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
                })(window, document, "clarity", "script", "${clarityId}");
              `,
            }}
          />
        )}
        {/* Google tag (gtag.js) - beforeInteractive so it runs in initial HTML like Google recommends */}
        {gaId && (
          <>
            <Script
              id="google-gtag-src"
              strategy="beforeInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <Script
              id="google-gtag-config"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
        {/* Umami Tracker - MUST load before recorder.js */}
        {isProd && umamiWebsiteId && (
          <script
            defer
            src="https://analytics.superlabs.co/script.js"
            data-website-id={umamiWebsiteId}
            data-domains={umamiDomains}
          />
        )}
        {/* Umami Session Replay */}
        {isProd && umamiWebsiteId && umamiReplayEnabled && (
          <script
            defer
            src="https://analytics.superlabs.co/recorder.js"
            data-website-id={umamiWebsiteId}
            data-sample-rate="1"
            data-mask-level="moderate"
            data-max-duration="300000"
            data-domains={umamiDomains}
          />
        )}
        {/* First-party analytics script from API (same base as NEXT_PUBLIC_API_URL) */}
        {apiAnalyticsSrc && (
          <ApiAnalyticsTracker
            src={apiAnalyticsSrc}
            baseUrl={API_BASE_URL}
            ingestKey={analyticsIngestKey}
            appVersion={analyticsAppVersion}
          />
        )}
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <VideoProvider>
            <SidebarProvider>
              <VideoUploadQueueProvider>{children}</VideoUploadQueueProvider>
            </SidebarProvider>
          </VideoProvider>
        </AuthProvider>
        <Toaster />
        {/* Analytics */}
        {clarityId && <ClarityTracker />}
        {gaId && <GATracker gaId={gaId} />}
      </body>
    </html>
  )
}
