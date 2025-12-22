/**
 * Service Worker registration and management for video streaming
 * This allows videos to stream directly from Workers with authentication
 */

import { getWorkersApiKey } from './storage'

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[hiffi] Service Worker not supported')
    return Promise.resolve(null)
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[hiffi] Service Worker registered:', registration.scope)

      // Function to send API key to service worker
      const sendAPIKey = (worker: ServiceWorker | null) => {
        if (worker) {
          // Get API key using the same function as other parts of the app
          const apiKey = getWorkersApiKey()
          worker.postMessage({
            type: 'SET_API_KEY',
            apiKey: apiKey,
          })
          console.log('[hiffi] Sent API key to Service Worker')
        }
      }

      // Update the service worker with the API key
      if (registration.active) {
        sendAPIKey(registration.active)
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing?.state === 'activated') {
            sendAPIKey(registration.installing)
          }
        })
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              sendAPIKey(newWorker)
            }
          })
        }
      })

      return registration
    })
    .catch((error) => {
      console.error('[hiffi] Service Worker registration failed:', error)
      return null
    })
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false)
  }

  return navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      return Promise.all(
        registrations.map((registration) => registration.unregister())
      ).then(() => true)
    })
    .catch(() => false)
}

