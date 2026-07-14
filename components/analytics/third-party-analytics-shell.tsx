"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { isAdminAnalyticsSurface } from "@/lib/analytics/admin-analytics-guard"
import { ClarityTracker } from "@/components/analytics/clarity-tracker"
import { GATracker } from "@/components/analytics/ga-tracker"

type ThirdPartyAnalyticsShellProps = {
  clarityId?: string | null
  gaId?: string | null
  umamiWebsiteId?: string | null
  umamiDomains?: string
  umamiPerformanceEnabled?: boolean
  umamiReplayEnabled?: boolean
  isProd?: boolean
  isBeta?: boolean
}

export function ThirdPartyAnalyticsShell({
  clarityId,
  gaId,
  umamiWebsiteId,
  umamiDomains,
  umamiPerformanceEnabled = false,
  umamiReplayEnabled = false,
  isProd = false,
  isBeta = false,
}: ThirdPartyAnalyticsShellProps) {
  const pathname = usePathname() || ""
  const isAdminRoute = isAdminAnalyticsSurface(pathname)

  if (isAdminRoute) {
    return null
  }

  const showUmami = Boolean(umamiWebsiteId && (isProd || isBeta))

  return (
    <>
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
      {gaId && (
        <>
          <Script
            id="google-gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-gtag-config"
            strategy="afterInteractive"
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
      {showUmami && (
        <Script
          src="https://analytics.superlabs.co/script.js"
          data-website-id={umamiWebsiteId!}
          data-domains={umamiDomains}
          data-performance={isBeta ? "true" : umamiPerformanceEnabled ? "true" : undefined}
          strategy="afterInteractive"
        />
      )}
      {isProd && showUmami && umamiReplayEnabled && (
        <Script
          src="https://analytics.superlabs.co/recorder.js"
          data-website-id={umamiWebsiteId!}
          data-sample-rate="100"
          data-mask-level="moderate"
          data-max-duration="300000"
          data-domains={umamiDomains}
          strategy="afterInteractive"
        />
      )}
      {clarityId && <ClarityTracker />}
      {gaId && <GATracker gaId={gaId} />}
    </>
  )
}
