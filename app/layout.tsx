import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { AuthProvider } from '@/lib/auth-context'
import { SidebarProvider } from '@/lib/sidebar-context'
import { VideoProvider } from '@/lib/video-context'
import { Toaster } from '@/components/ui/toaster'
import { ClarityTracker } from '@/components/analytics/clarity-tracker'
import { GATracker } from '@/components/analytics/ga-tracker'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Hiffi - Streaming Platform',
  description: 'Modern video streaming platform for creators',
  generator: 'hiffi.app',
  icons: {
    icon: [
      {
        url: '/hiffi_logo.png',
        type: 'image/png',
      },
    ],
    apple: '/hiffi_logo.png',
  },
}

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
              {children}
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
