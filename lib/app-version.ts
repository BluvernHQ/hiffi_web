/** Release semver — source of truth is package.json, injected at build time. */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"

/** Deploy artifact id — changes every build; used for stale-tab detection. */
export const APP_BUILD_ID = process.env.NEXT_PUBLIC_APP_BUILD_ID ?? "dev"

export type AppVersionInfo = {
  version: string
  buildId: string
}

export function getAppVersionInfo(): AppVersionInfo {
  return {
    version: APP_VERSION,
    buildId: APP_BUILD_ID,
  }
}

/** Analytics / support label: product line + semver. */
export function getAnalyticsAppVersion(): string {
  return `web@${APP_VERSION}`
}

/**
 * build_id for HifiAnalytics v2 ingest (required on every event).
 * Prefers NEXT_PUBLIC_BUILD_ID, then deploy artifact id, then "dev".
 */
export function getAnalyticsBuildId(): string {
  const fromEnv = process.env.NEXT_PUBLIC_BUILD_ID?.trim()
  if (fromEnv) return fromEnv
  if (APP_BUILD_ID && APP_BUILD_ID !== "dev") return APP_BUILD_ID
  return APP_BUILD_ID || "dev"
}
