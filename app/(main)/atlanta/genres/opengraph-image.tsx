import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

export default function AtlantaGenresIndexOgImage() {
  return createAtlantaOgImage({
    eyebrow: "Atlanta · Genres",
    title: "Atlanta Genre Hubs",
    subtitle: "Trap, crunk, snap, Dirty South, and more",
  })
}
