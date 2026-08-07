/**
 * Small first-party UX prefs: localStorage for client speed + cookies so
 * home hero and watch can share mute/mood across soft navigations.
 * Never store secrets here.
 */

const MUTED_KEY = "hiffi_player_muted"
const VOLUME_KEY = "hiffi_player_volume"
const PREVIEW_AUDIO_KEY = "hiffi_preview_audio"
const MOOD_KEY = "hiffi_active_mood"

const YEAR_SECONDS = 365 * 24 * 60 * 60
const MOOD_MAX_AGE = 7 * 24 * 60 * 60

function canUseDom(): boolean {
  return typeof document !== "undefined"
}

function secureFlag(): string {
  if (typeof window === "undefined") return ""
  return window.location.protocol === "https:" ? ";Secure" : ""
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!canUseDom()) return
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSeconds};SameSite=Lax${secureFlag()}`
}

function readCookie(name: string): string | null {
  if (!canUseDom()) return null
  const prefix = `${name}=`
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim()
    if (cookie.startsWith(prefix)) {
      return decodeURIComponent(cookie.slice(prefix.length))
    }
  }
  return null
}

function clearCookie(name: string): void {
  if (!canUseDom()) return
  document.cookie = `${name}=;path=/;max-age=0;SameSite=Lax${secureFlag()}`
}

function readLocal(key: string): string | null {
  if (typeof window === "undefined") return null
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocal(key: string, value: string): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore quota / private mode */
  }
}

/** Prefer unmuted when the user has explicitly asked for sound. */
export function getPlayerMuted(): boolean {
  const fromLocal = readLocal(MUTED_KEY)
  if (fromLocal !== null) return fromLocal === "true"
  const fromCookie = readCookie(MUTED_KEY)
  if (fromCookie !== null) return fromCookie === "true"
  // Legacy hero flag
  const preview = readLocal(PREVIEW_AUDIO_KEY) ?? readCookie(PREVIEW_AUDIO_KEY)
  if (preview === "on") return false
  if (preview === "off") return true
  return false
}

export function setPlayerMuted(muted: boolean): void {
  const value = muted ? "true" : "false"
  writeLocal(MUTED_KEY, value)
  writeCookie(MUTED_KEY, value, YEAR_SECONDS)
  // Keep hero preview preference aligned
  const preview = muted ? "off" : "on"
  writeLocal(PREVIEW_AUDIO_KEY, preview)
  writeCookie(PREVIEW_AUDIO_KEY, preview, YEAR_SECONDS)
}

export function getPlayerVolume(): number {
  const fromLocal = readLocal(VOLUME_KEY)
  if (fromLocal !== null) {
    const n = parseFloat(fromLocal)
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n))
  }
  const fromCookie = readCookie(VOLUME_KEY)
  if (fromCookie !== null) {
    const n = parseFloat(fromCookie)
    if (Number.isFinite(n)) return Math.min(1, Math.max(0, n))
  }
  return 1
}

export function setPlayerVolume(volume: number): void {
  const clamped = Math.min(1, Math.max(0, volume))
  const value = String(clamped)
  writeLocal(VOLUME_KEY, value)
  writeCookie(VOLUME_KEY, value, YEAR_SECONDS)
}

/**
 * Hero autoplay stays muted until a gesture. After the user unmutes once
 * (home or watch), prefer sound on later hero plays.
 */
export function isPreviewAudioPreferred(): boolean {
  const preview = readLocal(PREVIEW_AUDIO_KEY) ?? readCookie(PREVIEW_AUDIO_KEY)
  if (preview === "on") return true
  if (preview === "off") return false
  const muted = readLocal(MUTED_KEY) ?? readCookie(MUTED_KEY)
  if (muted === "false") return true
  if (muted === "true") return false
  return false
}

export function setPreviewAudioPreferred(enabled: boolean): void {
  setPlayerMuted(!enabled)
}

/**
 * Mood mix query. sessionStorage for tab session; cookie so a return visit
 * can restore the chip selection.
 */
export function getPersistedMoodPref(): string | null {
  if (typeof window !== "undefined") {
    try {
      const session = sessionStorage.getItem(MOOD_KEY)
      if (session && session.length > 0) return session
    } catch {
      /* ignore */
    }
  }
  const cookie = readCookie(MOOD_KEY)
  return cookie && cookie.length > 0 ? cookie : null
}

export function setPersistedMoodPref(query: string | null): void {
  if (typeof window !== "undefined") {
    try {
      if (query) sessionStorage.setItem(MOOD_KEY, query)
      else sessionStorage.removeItem(MOOD_KEY)
    } catch {
      /* ignore */
    }
  }
  if (query) writeCookie(MOOD_KEY, query, MOOD_MAX_AGE)
  else clearCookie(MOOD_KEY)
}
