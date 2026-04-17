/**
 * Service Worker registration and management for video streaming
 * This allows videos to stream directly from Workers with authentication
 */

import { getWorkersApiKey } from './storage'
import { apiClient } from './api-client'
const TOKEN_KEY = "hiffi_auth_token"

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[hiffi] Service Worker not supported')
    return Promise.resolve(null)
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[hiffi] Service Worker registered:', registration.scope)

      // Function to send auth headers to service worker
      const sendAuthHeaders = (worker: ServiceWorker | null) => {
        if (worker) {
          const apiKey = getWorkersApiKey()
          const authToken = apiClient.getAuthToken() || ''
          worker.postMessage({
            type: 'SET_AUTH_HEADERS',
            apiKey: apiKey,
            authToken: authToken,
          })
          console.log('[hiffi] Sent auth headers to Service Worker')
        }
      }

      // Update the service worker with the API key
      if (registration.active) {
        sendAuthHeaders(registration.active)
      } else if (registration.installing) {
        registration.installing.addEventListener('statechange', () => {
          if (registration.installing?.state === 'activated') {
            sendAuthHeaders(registration.installing)
          }
        })
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              sendAuthHeaders(newWorker)
            }
          })
        }
      })

      // Keep Service Worker auth headers in sync after login/logout/token refresh.
      if (typeof window !== 'undefined') {
        const syncActiveWorker = () => {
          const worker = registration.active || registration.waiting || registration.installing || null
          sendAuthHeaders(worker)
        }

        // Token changes in same tab won't trigger "storage", so sync on focus/visibility too.
        window.addEventListener('focus', syncActiveWorker)
        document.addEventListener('visibilitychange', syncActiveWorker)

        window.addEventListener('storage', (event) => {
          if (event.key === TOKEN_KEY) {
            syncActiveWorker()
          }
        })
      }

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

