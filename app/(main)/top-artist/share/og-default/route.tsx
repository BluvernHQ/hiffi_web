import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const runtime = "nodejs"
export const contentType = "image/png"
export const size = { width: 1200, height: 630 }
export const alt = "Hiffi Hip-Hop 500"

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(join(process.cwd(), "public/appbarlogo.png"))
    return `data:image/png;base64,${bytes.toString("base64")}`
  } catch {
    return null
  }
}

/** Default OG image for /top-artist page shares (no specific artist). */
export async function GET() {
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
            padding: "48px 56px",
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
              <div style={{ width: 10, height: 10, borderRadius: 999, background: "#E31E24" }} />
              Live YouTube rap index
            </div>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" width={200} height={44} style={{ objectFit: "contain" }} />
            ) : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 88,
                fontWeight: 900,
                lineHeight: 0.92,
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
              }}
            >
              The 500 moving hip-hop
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "#8B8A90", maxWidth: 720 }}>
              Live movement signals across the artists shaping rap on YouTube.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(242,239,233,0.14)",
              paddingTop: 22,
              fontSize: 22,
              color: "#8B8A90",
            }}
          >
            <div style={{ display: "flex", fontWeight: 800, color: "#F2EFE9" }}>HIFFI 500</div>
            <div style={{ display: "flex" }}>hiffi.com/top-artist</div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
