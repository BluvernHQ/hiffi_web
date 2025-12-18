'use client'

import { useEffect, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Inner ClarityTracker component that uses useSearchParams
 * Must be wrapped in Suspense boundary
 */
function ClarityTrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track if Clarity is loaded and available
    if (typeof window !== 'undefined' && (window as any).clarity) {
      // Track page view on route change
      ;(window as any).clarity('trackPageview')
    }
  }, [pathname, searchParams])

  return null
}

/**
 * ClarityTracker component for tracking page views in Next.js App Router
 * 
 * Microsoft Clarity doesn't automatically track page views in SPAs with client-side routing.
 * This component listens for route changes and manually triggers page view tracking.
 */
export function ClarityTracker() {
  return (
    <Suspense fallback={null}>
      <ClarityTrackerInner />
    </Suspense>
  )
}
