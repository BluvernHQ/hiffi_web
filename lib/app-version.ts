/** Semver from package.json, injected at build via next.config.mjs */
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0"

export function getAppVersionLabel(): string {
  return `v${APP_VERSION}`
}
