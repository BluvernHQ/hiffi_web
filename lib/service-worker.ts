/**
 * Registers a no-op service worker so older clients drop the worker that
 * injected x-api-key on Workers video requests. Video bytes are plain GETs
 * so Cloudflare can cache them.
 */

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null)
  }

  return navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((registration) => {
      console.log('[hiffi] Service Worker registered:', registration.scope)
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
