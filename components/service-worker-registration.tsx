'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/lib/service-worker'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('[hiffi] Service Worker ready for video streaming')
      }
    })
  }, [])

  return null
}

