import { ImageResponse } from "next/og"
import { fetchTopArtistsUpTo } from "@/lib/top-artists"

export const alt = "Hiffi 500 share card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

type Props = { params: Promise<{ username: string }> }

export default async function Hiffi500ShareOgImage({ params }: Props) {
  const { username } = await params
  const batch = await fetchTopArtistsUpTo(200)
  const artist = batch.items.find((a) => a.username.toLowerCase() === username.toLowerCase())

  const name = artist?.artist_name ?? username
  const rank = artist?.rank ?? "—"
  const location = artist?.location ?? "Hip-Hop / Rap"
  const asOf = new Date(batch.fetched_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "linear-gradient(145deg, #1c1917 0%, #450a0a 55%, #E8192C 100%)",
          color: "white",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 48,
            border: "2px solid rgba(255,255,255,0.2)",
            borderRadius: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 48,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 900, letterSpacing: 2 }}>
              HIFFI 500
            </div>
            <div style={{ display: "flex", fontSize: 22, opacity: 0.85 }}>{asOf}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", fontSize: 120, fontWeight: 900, lineHeight: 1 }}>
              #{rank}
            </div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 28, opacity: 0.85 }}>
              {location} · YouTube public data
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 24, opacity: 0.9 }}>
            Share your rank · Claim your profile on Hiffi
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
