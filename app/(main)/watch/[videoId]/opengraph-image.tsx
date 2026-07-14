import { ImageResponse } from "next/og"
import { fetchVideoForSeo } from "@/lib/seo/fetch-public"
import { buildWatchPageTitle } from "@/lib/seo/watch-meta"

export const alt = "Hiffi — Hip-Hop Music Video"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Props = { params: Promise<{ videoId: string }> }

export default async function WatchOgImage({ params }: Props) {
  const { videoId } = await params
  const video = await fetchVideoForSeo(videoId)

  const title = video ? buildWatchPageTitle(video) : "Hip-Hop Music Video"
  const artist = video
    ? (video.creatorDisplayName || video.creatorUsername || "").trim()
    : ""
  const thumbnail = video?.thumbnailUrl || null

  return new ImageResponse(
    (
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
        {/* Thumbnail as background when available */}
        {thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnail}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.35,
            }}
          />
        )}

        {/* Dark overlay gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.5) 100%)",
            display: "flex",
          }}
        />

        {/* Left accent bar */}
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

        {/* Content */}
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
          {/* HIFFI wordmark */}
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#DA291C",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginBottom: "24px",
              display: "flex",
            }}
          >
            HIFFI
          </div>

          {/* Artist name */}
          {artist && (
            <div
              style={{
                fontSize: "28px",
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                marginBottom: "12px",
                display: "flex",
                maxWidth: "900px",
              }}
            >
              {artist}
            </div>
          )}

          {/* Track title */}
          <div
            style={{
              fontSize: title.length > 50 ? "44px" : "56px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              display: "flex",
              maxWidth: "950px",
            }}
          >
            {title}
          </div>

          {/* Subline */}
          <div
            style={{
              marginTop: "20px",
              fontSize: "20px",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
            }}
          >
            Hip-Hop Music Video · hiffi.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
