import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { AuthProvider } from '@/lib/auth-context'
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

  return (
    <html lang="en">
      <head>
        {/* Microsoft Clarity */}
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
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        {/* Analytics */}
        {clarityId && <ClarityTracker />}
        {gaId && (
          <>
            <GoogleAnalytics gaId={gaId} />
            <GATracker gaId={gaId} />
          </>
        )}
      </body>
    </html>
  )
}
