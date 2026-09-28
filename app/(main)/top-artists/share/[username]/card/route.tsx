import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import {
  enrichTopArtistsWithImages,
  fetchTopArtistsByCityServer,
  fetchTopCitiesServer,
  resolveTopCity,
  type TopArtist,
} from "@/lib/top-artists"
import { getTopChartSnapshot, isChartMode, loadChartPage, withChartStats, type ChartMode } from "@/lib/top-chart"
import { SHARE_CARD_SIZE, type ShareCardFormat } from "@/lib/top-chart-share"
import { chartMovement, chartPlace, formatChartWeek } from "@/components/top-artists/premium/chart-format"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const INK = "#0A0A0C"
const PAPER = "#F4F1EA"
const RED = "#E8192C"

type CardData = {
  artist: TopArtist
  rank: number
  /** Null renders the Hiffi 500 brand lockup. */
  title: string | null
  sub: string
  chip: { text: string; tone: "up" | "down" | "plain" }
}

const MODE_TITLES: Record<Exclude<ChartMode, "overall">, string> = {
  risers: "Biggest Riser",
  breakout: "Breakout 100",
  heat: "Underground Heat",
}

function publicFile(path: string) {
  return readFile(join(process.cwd(), "public", path))
}

async function dataUrl(path: string, type: string): Promise<string | null> {
  try {
    return `data:${type};base64,${(await publicFile(path)).toString("base64")}`
  } catch {
    return null
  }
}

async function remoteImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    const type = res.headers.get("content-type") ?? ""
    if (!res.ok || !/image\/(jpe?g|png)/.test(type)) return null
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`
  } catch {
    return null
  }
}

function movementChip(artist: TopArtist, riser: boolean): CardData["chip"] {
  if (riser && (artist.rank_delta_7d ?? 0) > 0) return { text: `Up ${artist.rank_delta_7d} spots`, tone: "up" }
  const movement = chartMovement(artist)
  if (movement?.kind === "new") return { text: "New entry", tone: "plain" }
  if (movement?.kind === "up") return { text: `Up ${movement.value} this week`, tone: "up" }
  if (movement?.kind === "down") return { text: `Down ${movement.value} this week`, tone: "down" }
  return { text: "Ranked", tone: "plain" }
}

async function resolveCard(handle: string, params: URLSearchParams): Promise<CardData | null> {
  const cityParam = params.get("city")?.trim() ?? ""
  const modeParam = params.get("mode") ?? ""
  const mode: ChartMode = isChartMode(modeParam) ? modeParam : "overall"
  const windowDays = params.get("window") === "30" ? 30 : 7
  const matches = (artist: TopArtist) => artist.username.toLowerCase() === handle

  if (mode === "overall" && cityParam) {
    const cities = await fetchTopCitiesServer()
    const resolved = resolveTopCity(cities?.items ?? [], cityParam)
    if (resolved) {
      const page = await fetchTopArtistsByCityServer(resolved.query, 50, 0, { enrichImages: false })
      const hit = page?.items.find(matches)
      if (hit) {
        const [artist] = await withChartStats([hit])
        return {
          artist,
          rank: artist.rank,
          title: `${resolved.city.label} Top 50`,
          sub: "City Rankings",
          chip: movementChip(artist, false),
        }
      }
    }
  }

  if (mode !== "overall") {
    const page = await loadChartPage({ mode, city: null, window: windowDays }, 0, { limit: 100, enrich: false })
    const artist = page?.items.find(matches)
    if (artist) {
      return {
        artist,
        rank: artist.rank,
        title: mode === "risers" && artist.is_new_entry ? "New Entry" : MODE_TITLES[mode],
        sub: "Hiffi 500 Global",
        chip: movementChip(artist, mode === "risers"),
      }
    }
  }

  const artist = (await getTopChartSnapshot()).get(handle)
  if (!artist) return null
  return {
    artist,
    rank: artist.global_rank ?? artist.rank,
    title: null,
    sub: "Global Rankings",
    chip: movementChip(artist, false),
  }
}

function nameSize(name: string, story: boolean): number {
  const length = name.length
  const base = length <= 8 ? 132 : length <= 12 ? 112 : length <= 16 ? 94 : length <= 22 ? 78 : 64
  return Math.round(base * (story ? 1.15 : 1))
}

function rankSize(rank: number, story: boolean): number {
  const digits = String(rank).length
  const base = digits <= 1 ? 250 : digits === 2 ? 228 : 196
  return Math.round(base * (story ? 1.3 : 1))
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function Corner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const top = position[0] === "t"
  const left = position[1] === "l"
  return (
    <div
      style={{
        position: "absolute",
        width: 64,
        height: 64,
        ...(top ? { top: 40 } : { bottom: 40 }),
        ...(left ? { left: 40 } : { right: 40 }),
        ...(top ? { borderTop: `3px solid ${RED}` } : { borderBottom: `3px solid ${RED}` }),
        ...(left ? { borderLeft: `3px solid ${RED}` } : { borderRight: `3px solid ${RED}` }),
      }}
    />
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const handle = decodeURIComponent(username).trim().toLowerCase().replace(/^@+/, "")
  const search = new URL(request.url).searchParams
  const format: ShareCardFormat = search.get("format") === "story" ? "story" : "square"
  const story = format === "story"
  const { width, height } = SHARE_CARD_SIZE[format]

  const card = handle ? await resolveCard(handle, search) : null
  if (!card) return new Response("Artist not on the chart", { status: 404 })

  const [withImage] = await enrichTopArtistsWithImages([card.artist])
  const [photo, logo, mark, bold, regular] = await Promise.all([
    remoteImage(withImage.image),
    dataUrl("appbarlogo.png", "image/png"),
    dataUrl("top-artists/img/hiffi-mark.png", "image/png"),
    publicFile("top-artists/assets/fonts/NimbusSansNarrow-Bold.otf"),
    publicFile("top-artists/assets/fonts/NimbusSansNarrow-Regular.otf"),
  ])

  const name = card.artist.artist_name || card.artist.username
  const rawPlace = chartPlace(card.artist)
  const place = rawPlace && card.title?.toLowerCase().startsWith(rawPlace.toLowerCase()) ? null : rawPlace
  const week = formatChartWeek(card.artist.ranking?.updated_at) ?? formatChartWeek(new Date().toISOString())
  const photoSize = story ? 340 : 212
  const chipColor = card.chip.tone === "up" ? "#7BD88F" : card.chip.tone === "down" ? "#FF6B78" : "rgba(244,241,234,0.75)"
  const eyebrow = { fontSize: story ? 28 : 22, letterSpacing: "0.34em", textTransform: "uppercase" as const }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width,
          height,
          background: INK,
          color: PAPER,
          fontFamily: "Signal",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 50% ${story ? "50%" : "56%"}, rgba(232,25,44,0.5) 0%, rgba(232,25,44,0.16) 34%, rgba(10,10,12,0) 64%)`,
          }}
        />
        {mark ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mark}
            alt=""
            width={Math.round(height * 0.8 * (649 / 900))}
            height={Math.round(height * 0.8)}
            style={{
              position: "absolute",
              left: Math.round((width - height * 0.8 * (649 / 900)) / 2),
              top: Math.round(height * 0.1),
              opacity: 0.09,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)",
          }}
        />
        <Corner position="tl" />
        <Corner position="tr" />
        <Corner position="bl" />
        <Corner position="br" />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            height: "100%",
            padding: story ? "150px 96px 130px" : "92px 96px 78px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", ...eyebrow, color: "rgba(244,241,234,0.55)" }}>Official</div>
            {card.title ? (
              <div
                style={{
                  display: "flex",
                  marginTop: story ? 16 : 12,
                  fontSize: story ? 96 : 76,
                  fontWeight: 700,
                  lineHeight: 0.9,
                  textTransform: "uppercase",
                  color: RED,
                }}
              >
                {card.title}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", marginTop: story ? 16 : 12, gap: story ? 10 : 8 }}>
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt="" width={story ? 290 : 232} height={story ? 68 : 54} style={{ objectFit: "contain" }} />
                ) : null}
                <div style={{ display: "flex", fontSize: story ? 104 : 82, fontWeight: 700, lineHeight: 0.85, color: RED }}>
                  500
                </div>
              </div>
            )}
            <div style={{ display: "flex", marginTop: story ? 18 : 14, ...eyebrow, color: "rgba(244,241,234,0.8)" }}>
              {card.sub}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                width={photoSize}
                height={photoSize}
                style={{ objectFit: "cover", borderRadius: story ? 36 : 26, border: "2px solid rgba(244,241,234,0.18)" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: photoSize,
                  height: photoSize,
                  borderRadius: story ? 36 : 26,
                  border: "2px solid rgba(244,241,234,0.18)",
                  background: "linear-gradient(160deg, #2A0C10 0%, #120708 100%)",
                  fontSize: photoSize * 0.38,
                  fontWeight: 700,
                  color: "rgba(244,241,234,0.85)",
                }}
              >
                {initials(name)}
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                maxWidth: "100%",
                marginTop: story ? 44 : 26,
                fontSize: nameSize(name, story),
                fontWeight: 700,
                lineHeight: 0.9,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {name}
            </div>
            {place ? (
              <div style={{ display: "flex", marginTop: story ? 18 : 12, ...eyebrow, color: "rgba(244,241,234,0.55)" }}>
                {place}
              </div>
            ) : null}
            <div
              style={{
                display: "flex",
                marginTop: story ? 40 : 24,
                fontSize: rankSize(card.rank, story),
                fontWeight: 700,
                lineHeight: 0.84,
                color: RED,
                textShadow: "0 0 70px rgba(232,25,44,0.55)",
              }}
            >
              {`#${card.rank}`}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: story ? 28 : 16,
                padding: story ? "12px 26px" : "9px 20px",
                borderRadius: 999,
                border: "1.5px solid rgba(244,241,234,0.22)",
                background: "rgba(10,10,12,0.55)",
                ...eyebrow,
                fontSize: story ? 24 : 19,
                letterSpacing: "0.26em",
                color: chipColor,
              }}
            >
              {card.chip.text}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              paddingTop: story ? 26 : 20,
              borderTop: "1.5px solid rgba(244,241,234,0.16)",
              ...eyebrow,
              fontSize: story ? 24 : 19,
              letterSpacing: "0.28em",
              color: "rgba(244,241,234,0.6)",
            }}
          >
            <div style={{ display: "flex" }}>{week ? `Week of ${week}` : "This week"}</div>
            <div style={{ display: "flex", color: PAPER }}>hiffi.com/top-artists</div>
          </div>
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts: [
        { name: "Signal", data: bold, weight: 700, style: "normal" },
        { name: "Signal", data: regular, weight: 400, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600" },
    },
  )
}
