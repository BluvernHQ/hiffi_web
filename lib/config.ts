/**
 * Centralized configuration for API and object storage base URLs
 * Switch between environments using NEXT_PUBLIC_ENV environment variable
 * 
 * Usage:
 *   - Set NEXT_PUBLIC_ENV=dev for development
 *   - Set NEXT_PUBLIC_ENV=beta for beta/staging
 *   - Set NEXT_PUBLIC_ENV=prod for production
 *   - Defaults to 'beta' if not set
 */

export type Environment = 'dev' | 'beta' | 'prod'

interface EnvironmentConfig {
  apiBaseUrl: string
  workersBaseUrl: string
}

const environments: Record<Environment, EnvironmentConfig> = {
  dev: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.hiffi.com',
    workersBaseUrl: process.env.NEXT_PUBLIC_WORKERS_URL || 'https://black-paper-83cf.hiffi.workers.dev',
  },
  beta: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.dev.hiffi.com',
    workersBaseUrl: process.env.NEXT_PUBLIC_WORKERS_URL || 'https://prod.hiffi.workers.dev',
  },
  prod: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.hiffi.com',
    workersBaseUrl: process.env.NEXT_PUBLIC_WORKERS_URL || 'https://black-paper-83cf.hiffi.workers.dev',
  },
}

/**
 * Get the current environment from NEXT_PUBLIC_ENV or default to 'beta'
 */
function getCurrentEnvironment(): Environment {
  const env = (process.env.NEXT_PUBLIC_ENV || 'beta').toLowerCase() as Environment
  if (env in environments) {
    return env
  }
  console.warn(`[config] Invalid environment "${env}", defaulting to "beta"`)
  return 'beta'
}

const currentEnv = getCurrentEnvironment()
const config = environments[currentEnv]

/**
 * API Base URL for REST API endpoints
 * Can be overridden with NEXT_PUBLIC_API_URL environment variable
 */
export const API_BASE_URL = config.apiBaseUrl

/**
 * Workers Base URL for object storage (videos, thumbnails, profile pictures)
 * Can be overridden with NEXT_PUBLIC_WORKERS_URL environment variable
 */
export const WORKERS_BASE_URL = config.workersBaseUrl

/**
 * Get the current environment name
 */
export function getEnvironment(): Environment {
  return currentEnv
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return currentEnv === 'dev'
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return currentEnv === 'prod'
}

// Log configuration on load (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[config] Environment:', currentEnv)
  console.log('[config] API Base URL:', API_BASE_URL)
  console.log('[config] Workers Base URL:', WORKERS_BASE_URL)
}

