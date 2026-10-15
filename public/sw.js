// Playback goes straight to Workers with no custom auth headers.
// Do not intercept /videos/* — x-api-key or Authorization makes those GETs
// uncacheable at the Cloudflare edge (and forces a CORS preflight).
//
// This worker stays registered so it replaces older builds that injected x-api-key.

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
