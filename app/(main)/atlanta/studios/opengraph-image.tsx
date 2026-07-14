import {
  ATLANTA_OG_ALT,
  ATLANTA_OG_CONTENT_TYPE,
  ATLANTA_OG_SIZE,
  createAtlantaOgImage,
} from "@/lib/atlanta/og-card"

export const alt = ATLANTA_OG_ALT
export const size = ATLANTA_OG_SIZE
export const contentType = ATLANTA_OG_CONTENT_TYPE

export default function AtlantaStudiosIndexOgImage() {
  return createAtlantaOgImage({
    eyebrow: "Atlanta · Studios",
    title: "Studios, Labels & Producers",
    subtitle: "Rooms and architects behind the sound",
  })
}
