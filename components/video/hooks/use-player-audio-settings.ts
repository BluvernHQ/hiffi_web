import { useEffect, useRef, useState } from "react"
import { getPlayerMuted, getPlayerVolume } from "@/lib/ux-prefs"

const STORAGE_KEYS = {
  VOLUME: "hiffi_player_volume",
  MUTED: "hiffi_player_muted",
} as const

/**
 * Player audio state. Callers must persist explicit user changes via
 * `setPlayerMuted` / `setPlayerVolume` from `@/lib/ux-prefs` — do not persist
 * transient autoplay mute here.
 */
export function usePlayerAudioSettings() {
  // Defaults must match the server render. Saved mute/volume is applied after mount.
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    volumeRef.current = volume
    isMutedRef.current = isMuted
  }, [volume, isMuted])

  useEffect(() => {
    const savedVolume = getPlayerVolume()
    const savedMuted = getPlayerMuted()
    if (savedVolume !== 1) setVolume(savedVolume)
    if (savedMuted) setIsMuted(true)
  }, [])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.VOLUME && e.newValue !== null) {
        setVolume(parseFloat(e.newValue))
      }
      if (e.key === STORAGE_KEYS.MUTED && e.newValue !== null) {
        setIsMuted(e.newValue === "true")
      }
    }
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  return { volume, setVolume, isMuted, setIsMuted, volumeRef, isMutedRef }
}
