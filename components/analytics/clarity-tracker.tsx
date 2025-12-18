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
    // Wait for Clarity to be fully initialized before tracking
    const trackPageView = () => {
      try {
        if (typeof window !== 'undefined') {
          const clarity = (window as any).clarity
          
          // Check if Clarity is available and ready
          if (clarity && typeof clarity === 'function') {
            // Clarity is ready, call it directly
            clarity('trackPageview')
          } else if (clarity && Array.isArray(clarity.q)) {
            // Clarity is loading, queue the call
            clarity.q.push(['trackPageview'])
          }
        }
      } catch (error) {
        // Silently fail - Clarity might not be loaded yet
        console.debug('[hiffi] Clarity tracking error:', error)
      }
    }

    // Small delay to ensure Clarity script has loaded
    const timeoutId = setTimeout(trackPageView, 100)
    
    return () => clearTimeout(timeoutId)
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
