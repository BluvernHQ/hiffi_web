/** Minimum tracks before a mood is considered "well-stocked" (analytics / future gating). */
export const MOOD_TAB_MIN_TRACKS = 15

export type MoodDef = {
  label: string
  /** Stable id for UI state / cache keys. */
  query: string
  cluster: string
  /** Descriptor shown in UI and sent to GET /playlist/mood/{query} (not the brand label). */
  vibe: string
  /** One-line hip-hop native descriptor shown when selected. */
  tagline: string
  /** CSS background for the mood orb. */
  gradient: string
  /** Image background for the mood orb (optional). */
  image?: string
  /** Accent for cluster badge. */
  accent: string
}

/** Hip-hop native mood taxonomy — labels listeners already use. */
export const MOODS: MoodDef[] = [
  {
    label: "On Sight",
    query: "on sight",
    cluster: "Aggressive",
    vibe: "Drill, trap bangers, rage",
    tagline: "No warning shots.",
    gradient: "radial-gradient(circle at 35% 28%, #ff2d42 0%, #c41228 38%, #6b0a18 72%, #2a0810 100%)",
    image: "/moodbp/onsight.png",
    accent: "#E8192C",
  },
  {
    label: "Soul Search",
    query: "soul search",
    cluster: "Introspective",
    vibe: "J. Cole mode, conscious rap",
    tagline: "In your bag, in your head.",
    gradient: "radial-gradient(circle at 30% 25%, #8b7ab8 0%, #5c4d8a 40%, #322a52 75%, #1a1528 100%)",
    image: "/moodbp/soulsearch.png",
    accent: "#6b5b95",
  },
  {
    label: "Money Talk",
    query: "money talk",
    cluster: "Triumphant",
    vibe: "Celebration, flexing, wins",
    tagline: "Receipts on receipts.",
    gradient: "radial-gradient(circle at 40% 30%, #f0d078 0%, #c9a030 42%, #7a6018 78%, #3d3010 100%)",
    image: "/moodbp/moneytalk.png",
    accent: "#c9a030",
  },
  {
    label: "Blue Hours",
    query: "blue hours",
    cluster: "Melancholic",
    vibe: "Heartbreak, late night",
    tagline: "After hours only.",
    gradient: "radial-gradient(circle at 35% 30%, #5a8ab8 0%, #3d5a80 45%, #1e3048 80%, #0c1824 100%)",
    image: "/moodbp/Bluehours.png",
    accent: "#3d5a80",
  },
  {
    label: "Low Rider",
    query: "low rider",
    cluster: "Chill",
    vibe: "Lo-fi hip-hop, boom bap",
    tagline: "Cruise control.",
    gradient: "radial-gradient(circle at 38% 32%, #e09870 0%, #b86a48 40%, #6b3e28 76%, #2a1810 100%)",
    image: "/moodbp/Lowrider.png",
    accent: "#b86a48",
  },
  {
    label: "Mosh Pit",
    query: "mosh pit",
    cluster: "Hype",
    vibe: "Workout, turn up",
    tagline: "Stage dive energy.",
    gradient: "radial-gradient(circle at 32% 28%, #d4f040 0%, #9ab820 42%, #4a6010 78%, #1a2008 100%)",
    image: "/moodbp/Moshpit.png",
    accent: "#9ab820",
  },
  {
    label: "God's Plan",
    query: "god's plan",
    cluster: "Spiritual",
    vibe: "Faith, legacy, purpose",
    tagline: "Bigger than the moment.",
    gradient: "radial-gradient(circle at 40% 25%, #f8f4ee 0%, #c8c0b4 38%, #787068 72%, #2a2824 100%)",
    image: "/moodbp/Godsplan.png",
    accent: "#8a8078",
  },
]

export function moodByQuery(query: string): MoodDef | undefined {
  return MOODS.find((m) => m.query === query)
}

export function moodSearchQuery(query: string): string {
  return moodByQuery(query)?.vibe ?? query
}

/** Stable playlist id returned by GET /playlist/mood/{query}. */
export function moodPlaylistIdForQuery(moodQuery: string): string {
  return `mood:${moodSearchQuery(moodQuery).toLowerCase().trim()}`
}

export function moodQueryFromPlaylistId(playlistId: string): string | null {
  if (!playlistId.startsWith("mood:")) return null
  return playlistId.slice(5).trim() || null
}

export function moodLabelForQuery(query: string): string | undefined {
  return moodByQuery(query)?.label
}

export function moodQueryPathSegment(query: string): string {
  return encodeURIComponent(query.toLowerCase().trim())
}

const PICKER_DISMISSED_KEY = "hiffi_mood_picker_dismissed"

export function isMoodPickerDismissed(): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(PICKER_DISMISSED_KEY) === "1"
  } catch {
    return false
  }
}

export function setMoodPickerDismissed(dismissed: boolean): void {
  if (typeof window === "undefined") return
  try {
    if (dismissed) sessionStorage.setItem(PICKER_DISMISSED_KEY, "1")
    else sessionStorage.removeItem(PICKER_DISMISSED_KEY)
  } catch {
    /* ignore */
  }
}
