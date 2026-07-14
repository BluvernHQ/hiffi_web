const PREVIEW_AUDIO_KEY = "hiffi_preview_audio"

export function isPreviewAudioPreferred(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(PREVIEW_AUDIO_KEY) === "on"
  } catch {
    return false
  }
}

export function setPreviewAudioPreferred(enabled: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PREVIEW_AUDIO_KEY, enabled ? "on" : "off")
  } catch {
    // no-op
  }
}
