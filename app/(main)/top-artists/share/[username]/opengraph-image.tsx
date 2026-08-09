import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { fetchTopArtistsUpTo, topArtistScoreBand } from "@/lib/top-artists"

export const alt = "Hiffi Hip-Hop 500 share card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const runtime = "nodejs"

type Props = {
  params: Promise<{ username: string }>
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(join(process.cwd(), "public/appbarlogo.png"))
    return `data:image/png;base64,${bytes.toString("base64")}`
  } catch {
    return null
  }
}

export default async function TopArtistShareOgImage({ params }: Props) {
  const { username } = await params
  const handle = username.trim().toLowerCase().replace(/^@+/, "")

  let name = username
  let rankLabel = "—"
  let subline = "Hiffi Hip-Hop 500"
  let band = "Emerging band"
  const eyebrow = "Hiffi 500 · Global"

  try {
    const batch = await fetchTopArtistsUpTo(500)
    const artist = batch.items.find((a) => a.username.toLowerCase() === handle)
    if (artist) {
      name = artist.artist_name || artist.username
      rankLabel = `#${artist.global_rank ?? artist.rank}`
      subline = artist.location || "YouTube public data"
      band = topArtistScoreBand(artist).label
    }
  } catch {
    // Keep fallbacks — OG image should still render.
  }

  const logo = await loadLogoDataUrl()

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "1200px",
          height: "630px",
          background: "#0A0A0C",
          color: "#F2EFE9",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(242,239,233,0.08) 0 1px, transparent 1px 120px)",
            opacity: 0.45,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "2px solid rgba(242,239,233,0.28)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px 48px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 22,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8B8A90",
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: "#E31E24",
                }}
              />
              {eyebrow}
            </div>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={180} height={40} style={{ objectFit: "contain" }} />
            ) : (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 900, letterSpacing: 1 }}>
                HIFFI
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 40,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  fontWeight: 900,
                  lineHeight: 0.95,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                }}
              >
                {name}
              </div>
              <div style={{ display: "flex", fontSize: 28, color: "#8B8A90" }}>{subline}</div>
              <div
                style={{
                  display: "flex",
                  marginTop: 8,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(201,162,39,0.55)",
                  background: "rgba(201,162,39,0.12)",
                  color: "#C9A227",
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {band}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 220,
                height: 160,
                background: "#18171B",
                border: "1px solid rgba(242,239,233,0.28)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#8B8A90",
                  fontWeight: 700,
                }}
              >
                Rank
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 72,
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "#E31E24",
                }}
              >
                {rankLabel}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              borderTop: "1px solid rgba(242,239,233,0.14)",
              paddingTop: 20,
              fontSize: 20,
              color: "#8B8A90",
            }}
          >
            <div style={{ display: "flex", fontWeight: 800, color: "#F2EFE9" }}>HIFFI 500</div>
            <div style={{ display: "flex" }}>hiffi.com/top-artists</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
