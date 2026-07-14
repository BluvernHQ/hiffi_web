// Service Worker to add x-api-key header to Workers video requests
// This allows videos to stream directly from Workers without needing a proxy
//
// NOTE: This file is static and cannot use environment variables at runtime.
// Update WORKERS_BASE_URL here to match your environment, or use a build script
// to inject the value from NEXT_PUBLIC_WORKERS_URL during build.
//
// Environment URLs:
//   - Dev: https://dev-workers.hiffi.workers.dev
//   - Beta: https://black-paper-83cf.hiffi.workers.dev (current)
//   - Prod: https://workers.hiffi.workers.dev

let API_KEY = 'gdwvvwwvdyvyvwevyvfwedfwerwf34rt3f3f3' // Default, will be updated via message
let AUTH_TOKEN = '' // JWT token, updated via message

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

// Listen for messages to update API key
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_AUTH_HEADERS') {
    API_KEY = event.data.apiKey || 'gdwvvwwvdyvyvwevyvfwedfwerwf34rt3f3f3'
    AUTH_TOKEN = event.data.authToken || ''
    console.log('[hiffi] Service Worker auth headers updated')
  }
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Only intercept requests to Hiffi Workers video endpoints
  const isWorkersVideo = url.hostname.endsWith('.hiffi.workers.dev') && url.pathname.startsWith('/videos/')
  
  if (isWorkersVideo) {
    // Clone the request to preserve headers
    const headers = new Headers(event.request.headers)
    headers.set('x-api-key', API_KEY)
    if (AUTH_TOKEN) {
      headers.set('authorization', `Bearer ${AUTH_TOKEN}`)
    }
    
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

