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
import { getSiteOrigin, absoluteUrl } from '@/lib/seo/site'
import { JsonLd } from '@/components/seo/json-ld'
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

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${getSiteOrigin()}/#website`,
    url: getSiteOrigin(),
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${getSiteOrigin()}/search?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${getSiteOrigin()}/#organization`,
    name: SITE_NAME,
    url: getSiteOrigin(),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/hiffi_logo.png"),
      width: 512,
      height: 512,
    },
    sameAs: [],
  },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

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
        {/* Umami - ID from env only */}
        {umamiWebsiteId && (
          <Script
            id="umami"
            src="https://analytics.superlabs.co/script.js"
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
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
