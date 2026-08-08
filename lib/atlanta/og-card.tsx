import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import type { ReactElement } from "react"

export const ATLANTA_OG_SIZE = { width: 1200, height: 630 }
export const ATLANTA_OG_CONTENT_TYPE = "image/png"
export const ATLANTA_OG_ALT = "Hiffi — Atlanta Hip-Hop Guide"

type AtlantaOgCardProps = {
  eyebrow: string
  title: string
  subtitle?: string
  /** Tab/brand icon as data URL for next/og <img> */
  logoSrc: string
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

async function loadHiffiLogoDataUrl(): Promise<string> {
  const bytes = await readFile(join(process.cwd(), "public/hiffi_logo.png"))
  return `data:image/png;base64,${bytes.toString("base64")}`
}

/** JSX tree for next/og ImageResponse — inline styles only. */
export function atlantaOgCardElement({
  eyebrow,
  title,
  subtitle,
  logoSrc,
}: AtlantaOgCardProps): ReactElement {
  const safeTitle = truncate(title, 90)
  const safeSubtitle = subtitle ? truncate(subtitle, 140) : undefined
  const titleSize = safeTitle.length > 56 ? 42 : safeTitle.length > 40 ? 48 : 56

  return (
    <div
      style={{
        display: "flex",
        width: "1200px",
        height: "630px",
        background: "#0a0a0a",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg, rgba(10,10,10,0.98) 0%, rgba(40,8,12,0.92) 45%, rgba(10,10,10,0.85) 100%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "6px",
          background: "#DA291C",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og requires img */}
          <img
            src={logoSrc}
            width={56}
            height={56}
            alt=""
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              objectFit: "cover",
            }}
          />
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#DA291C",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            HIFFI
          </div>
        </div>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "16px",
            display: "flex",
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.1,
            display: "flex",
            maxWidth: "950px",
          }}
        >
          {safeTitle}
        </div>
        {safeSubtitle ? (
          <div
            style={{
              marginTop: "18px",
              fontSize: "22px",
              color: "rgba(255,255,255,0.55)",
              display: "flex",
              maxWidth: "900px",
            }}
          >
            {safeSubtitle}
          </div>
        ) : null}
        <div
          style={{
            marginTop: "22px",
            fontSize: "18px",
            color: "rgba(255,255,255,0.35)",
            display: "flex",
          }}
        >
          Atlanta Hip-Hop Guide · hiffi.com
        </div>
      </div>
    </div>
  )
}

/** Shared ImageResponse builder — embeds the same icon used as the browser tab favicon. */
export async function createAtlantaOgImage(props: {
  eyebrow: string
  title: string
  subtitle?: string
}): Promise<ImageResponse> {
  const logoSrc = await loadHiffiLogoDataUrl()
  return new ImageResponse(
    atlantaOgCardElement({ ...props, logoSrc }),
    { ...ATLANTA_OG_SIZE },
  )
}
