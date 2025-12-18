'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Inner GATracker component that uses useSearchParams
 * Must be wrapped in Suspense boundary
 */
function GATrackerInner({ gaId }: { gaId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track if gtag is loaded and available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // Track page view on route change
      ;(window as any).gtag('config', gaId, {
        page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : ''),
      })
    }
  }, [pathname, searchParams, gaId])

  return null
}

/**
 * GATracker component for tracking page views in Next.js App Router
 * 
 * The GoogleAnalytics component from @next/third-parties automatically tracks
 * initial page loads, but doesn't track client-side route changes in SPAs.
 * This component listens for route changes and manually triggers page view tracking.
 */
export function GATracker({ gaId }: { gaId: string }) {
  return (
    <Suspense fallback={null}>
      <GATrackerInner gaId={gaId} />
    </Suspense>
  )
}
