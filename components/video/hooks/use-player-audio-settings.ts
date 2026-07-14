import { useEffect, useRef, useState } from "react"

const STORAGE_KEYS = {
  VOLUME: "hiffi_player_volume",
  MUTED: "hiffi_player_muted",
} as const

export function usePlayerAudioSettings() {
  // Initialize state from localStorage immediately to avoid flash of muted/unmuted
  const [volume, setVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.VOLUME)
      return saved !== null ? parseFloat(saved) : 1
    }
    return 1
  })

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEYS.MUTED)
      // Default to unmuted (false) to ensure sound is present by default
      return saved !== null ? saved === "true" : false
    }
    return false
  })

  // Use refs to keep state values accessible to event listeners without stale closures
  const volumeRef = useRef(volume)
  const isMutedRef = useRef(isMuted)

  useEffect(() => {
    volumeRef.current = volume
    isMutedRef.current = isMuted
  }, [volume, isMuted])

  // Sync audio state across instances (in case multiple players exist)
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

