// Service Worker to add x-api-key header to Workers video requests
// This allows videos to stream directly from Workers without needing a proxy

const WORKERS_BASE_URL = 'https://black-paper-83cf.hiffi.workers.dev'
let API_KEY = 'SECRET_KEY' // Default, will be updated via message

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Listen for messages to update API key
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_API_KEY') {
    API_KEY = event.data.apiKey || 'SECRET_KEY'
    console.log('[hiffi] Service Worker API key updated')
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only intercept requests to Workers video endpoint
  if (url.origin === WORKERS_BASE_URL && url.pathname.startsWith('/videos/')) {
    // Clone the request to preserve headers
    const headers = new Headers(event.request.headers)
    headers.set('x-api-key', API_KEY)
    
    // Preserve Range header if present (for video seeking)
    if (event.request.headers.has('range')) {
      headers.set('range', event.request.headers.get('range'))
    }
    
    event.respondWith(
      fetch(event.request.url, {
        method: event.request.method,
        headers: headers,
        signal: event.request.signal,
        // Preserve credentials and redirect settings
        credentials: event.request.credentials,
        redirect: event.request.redirect,
      })
    )
  }
  // Let all other requests pass through normally
})

