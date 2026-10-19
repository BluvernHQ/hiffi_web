/**
 * Centralized configuration for API and object storage base URLs.
 * Switch environments with NEXT_PUBLIC_ENV in `.env.local` (dev | beta | prod).
 *
 * After changing NEXT_PUBLIC_ENV, restart `npm run dev` so Next.js reloads env vars.
 */

export type Environment = 'dev' | 'beta' | 'prod'

interface EnvironmentConfig {
  apiBaseUrl: string
  workersBaseUrl: string
}

const environmentDefaults: Record<Environment, EnvironmentConfig> = {
  dev: {
    apiBaseUrl: 'https://api.hiffi.com',
    workersBaseUrl: 'https://prod.hiffi.workers.dev',
  },
  beta: {
    apiBaseUrl: 'https://api.dev.hiffi.com',
    workersBaseUrl: 'https://dev.hiffi.workers.dev',
  },
  prod: {
    apiBaseUrl: 'https://api.hiffi.com',
    workersBaseUrl: 'https://prod.hiffi.workers.dev',
  },
}

/** Read env on each call — avoids stale values cached at module load. */
export function getEnvironment(): Environment {
  const env = (process.env.NEXT_PUBLIC_ENV || 'beta').toLowerCase() as Environment
  if (env in environmentDefaults) {
    return env
  }
  console.warn(`[config] Invalid environment "${env}", defaulting to "beta"`)
  return 'beta'
}

/**
 * Server-side requests prefer `API_INTERNAL_URL` (e.g. `http://127.0.0.1:8080` when the API runs on
 * the same host) so SSR traffic skips Cloudflare and per-IP rate limits. Browsers never see it —
 * the variable is not `NEXT_PUBLIC_`, and every server use of this URL is a fetch target.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined' && process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL.replace(/\/+$/, '')
  }
  return process.env.NEXT_PUBLIC_API_URL || environmentDefaults[getEnvironment()].apiBaseUrl
}

/** Server-only. Prefer a loopback URL so auth calls skip Cloudflare. */
export function getInternalApiBaseUrl(): string {
  return (
    process.env.HIFFI_API_INTERNAL_URL?.trim() ||
    process.env.API_INTERNAL_URL?.trim() ||
    getApiBaseUrl()
  )
}

export function getWorkersBaseUrl(): string {
  return process.env.NEXT_PUBLIC_WORKERS_URL || environmentDefaults[getEnvironment()].workersBaseUrl
}

/** @deprecated Use getApiBaseUrl() — evaluated once at import time in client bundles. */
export const API_BASE_URL = getApiBaseUrl()

/** @deprecated Use getWorkersBaseUrl() — evaluated once at import time in client bundles. */
export const WORKERS_BASE_URL = getWorkersBaseUrl()

export function isDevelopment(): boolean {
  return getEnvironment() === 'dev'
}

export function isProduction(): boolean {
  return getEnvironment() === 'prod'
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[config] Environment:', getEnvironment())
  console.log('[config] API Base URL:', getApiBaseUrl())
  console.log('[config] Workers Base URL:', getWorkersBaseUrl())
}
