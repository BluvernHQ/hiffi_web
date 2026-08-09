import { getWorkersBaseUrl } from "@/lib/config"

export const dynamic = "force-dynamic"

/**
 * Injects Workers CDN base from NEXT_PUBLIC_WORKERS_URL / env config.
 * Loaded by /top-artists before app.js — no hostname hardcoding.
 */
export function GET() {
  const workersUrl = getWorkersBaseUrl().replace(/\/$/, "")
  const body = `window.__HIFFI_WORKERS_URL__=${JSON.stringify(workersUrl)};\n`
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  })
}
