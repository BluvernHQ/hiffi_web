const STANDARD_PROFILES = [2160, 1440, 1080, 720, 480, 360] as const

export function getResolutionProfile(height: number): string {
  for (const p of STANDARD_PROFILES) {
    if (height >= p * 0.9) return `${p}p`
  }
  return `${height}p`
}

export function generateSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `watch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

