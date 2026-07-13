import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"
import { ATLANTA_HUB } from "@/lib/atlanta/hub"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

export default function AtlantaHubOgImage() {
  return createAtlantaOgImage({
    eyebrow: "Atlanta Guide",
    title: ATLANTA_HUB.title,
    subtitle: "Genres · Best-of · Eras · Studios · Venues",
  })
}
