import { cn } from "@/lib/utils"

const HIFFI_RED = "#E8192C"
const HIFFI_BLACK = "#171717"

const BANNER_NOISE_FILTER_ID = "hiffi-profile-banner-noise"

type BannerPalette = {
  base: string
  glow: string
  glowX: string
  accent: string
  accentMuted: string
  nameGradient: string
  secondaryColor: string
  watermark: string
}

type BannerTheme = {
  palette: BannerPalette
  glowSide: "left" | "right"
  waveSeed: number
  waveGradientId: string
}

/** Cohesive HiFFi palettes — warm, vibrant, but restrained. */
const PALETTES: BannerPalette[] = [
  {
    base: "linear-gradient(145deg, #fff8f8 0%, #ffe4e8 45%, #ffd6de 100%)",
    glow: "rgba(232,25,44,0.28)",
    glowX: "82%",
    accent: HIFFI_RED,
    accentMuted: "rgba(232,25,44,0.14)",
    nameGradient: `linear-gradient(180deg, ${HIFFI_BLACK} 0%, #3f3f46 55%, ${HIFFI_RED} 130%)`,
    secondaryColor: HIFFI_RED,
    watermark: "rgba(232,25,44,0.07)",
  },
  {
    base: "linear-gradient(150deg, #fffaf7 0%, #ffedd5 48%, #fecdd3 100%)",
    glow: "rgba(225,29,72,0.24)",
    glowX: "18%",
    accent: "#e11d48",
    accentMuted: "rgba(225,29,72,0.12)",
    nameGradient: `linear-gradient(180deg, ${HIFFI_BLACK} 0%, #52525b 50%, #be123c 125%)`,
    secondaryColor: "#be123c",
    watermark: "rgba(190,24,93,0.06)",
  },
  {
    base: "linear-gradient(140deg, #ffffff 0%, #fff1f2 42%, #fecaca 100%)",
    glow: "rgba(232,25,44,0.26)",
    glowX: "70%",
    accent: HIFFI_RED,
    accentMuted: "rgba(232,25,44,0.13)",
    nameGradient: `linear-gradient(175deg, #18181b 0%, ${HIFFI_BLACK} 48%, ${HIFFI_RED} 135%)`,
    secondaryColor: "#dc2626",
    watermark: "rgba(232,25,44,0.065)",
  },
  {
    base: "linear-gradient(155deg, #fefefe 0%, #fce7f3 40%, #fbcfe8 100%)",
    glow: "rgba(219,39,119,0.22)",
    glowX: "24%",
    accent: "#db2777",
    accentMuted: "rgba(219,39,119,0.11)",
    nameGradient: `linear-gradient(180deg, ${HIFFI_BLACK} 0%, #404040 52%, ${HIFFI_RED} 128%)`,
    secondaryColor: HIFFI_RED,
    watermark: "rgba(219,39,119,0.06)",
  },
  {
    base: "linear-gradient(138deg, #fff5f5 0%, #ffc9c9 38%, #fff0f0 100%)",
    glow: "rgba(232,25,44,0.3)",
    glowX: "88%",
    accent: HIFFI_RED,
    accentMuted: "rgba(232,25,44,0.15)",
    nameGradient: `linear-gradient(168deg, ${HIFFI_BLACK} 0%, #27272a 50%, #e11d48 132%)`,
    secondaryColor: "#e11d48",
    watermark: "rgba(232,25,44,0.07)",
  },
  {
    base: "linear-gradient(148deg, #fffbeb 0%, #ffe4e6 50%, #fda4af 100%)",
    glow: "rgba(234,88,12,0.18)",
    glowX: "60%",
    accent: HIFFI_RED,
    accentMuted: "rgba(232,25,44,0.12)",
    nameGradient: `linear-gradient(180deg, ${HIFFI_BLACK} 0%, #44403c 54%, ${HIFFI_RED} 130%)`,
    secondaryColor: "#c2410c",
    watermark: "rgba(232,25,44,0.06)",
  },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

function profileBannerKey(displayName: string, username?: string): string {
  const name = displayName.trim().toLowerCase() || "artist"
  const handle = username?.trim().toLowerCase() || ""
  return handle ? `${handle}::${name}` : name
}

function getBannerTheme(displayName: string, username?: string): BannerTheme {
  const key = profileBannerKey(displayName, username)
  const hash = hashString(key)
  const hash2 = hashString(`${key}:wave`)

  return {
    palette: PALETTES[hash % PALETTES.length],
    glowSide: hash % 2 === 0 ? "right" : "left",
    waveSeed: hash2 % 97,
    waveGradientId: `hiffi-wave-${hash % 10000}`,
  }
}

function formatBannerName(displayName: string): { primary: string; secondary?: string } {
  const trimmed = displayName.trim() || "Artist"
  const parts = trimmed.split(/\s+/).filter(Boolean)

  if (parts.length >= 2 && trimmed.length > 12) {
    const primary = parts[0]
    const secondary = parts.slice(1).join(" ")
    if (secondary.length > 18) return { primary, secondary: `${secondary.slice(0, 16)}…` }
    return { primary, secondary }
  }

  if (trimmed.length > 20) return { primary: `${trimmed.slice(0, 18)}…` }
  return { primary: trimmed }
}

function waveBarHeights(seed: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed) * 0.5) * 0.5 + 0.5
    return 0.25 + wave * 0.5
  })
}

function BannerNoise() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-multiply"
      style={{ filter: `url(#${BANNER_NOISE_FILTER_ID})` }}
      aria-hidden
    />
  )
}

function BannerSoundWave({
  seed,
  side,
  gradientId,
  accent,
}: {
  seed: number
  side: "left" | "right"
  gradientId: string
  accent: string
}) {
  const heights = waveBarHeights(seed, 18)

  return (
    <svg
      className={cn(
        "pointer-events-none absolute bottom-0 h-[48%] w-[min(48%,220px)] opacity-70",
        side === "right" ? "right-0" : "left-[40%]",
      )}
      viewBox="0 0 220 70"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {heights.map((height, index) => {
        const barWidth = 5
        const gap = 3.5
        const x = index * (barWidth + gap) + 6
        const barHeight = height * 52
        return (
          <rect
            key={index}
            x={x}
            y={64 - barHeight}
            width={barWidth}
            height={barHeight}
            rx={1.5}
            fill={`url(#${gradientId})`}
          />
        )
      })}
    </svg>
  )
}

type HeroArtistNameProps = {
  displayName: string
  username?: string
  palette: BannerPalette
}

function HeroArtistName({ displayName, username, palette }: HeroArtistNameProps) {
  const { primary, secondary } = formatBannerName(displayName)
  const handle = username?.trim().toLowerCase() || displayName.trim().toLowerCase().replace(/\s+/g, "")

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-end px-[5%] pb-[21%] pt-[10%] pl-[36%] text-right">
      {/* Soft background watermark — texture only */}
      <p
        className="absolute right-[4%] top-[14%] max-w-[92%] select-none truncate font-black uppercase tracking-tighter"
        style={{
          fontSize: "clamp(2.5rem, 14vw, 6rem)",
          color: palette.watermark,
        }}
        aria-hidden
      >
        {primary}
      </p>

      <div className="relative z-[1] max-w-[min(100%,19rem)] sm:max-w-md">
        <p
          className="mb-1 text-[10px] font-medium tracking-wide sm:text-[11px]"
          style={{ color: palette.accent, opacity: 0.72 }}
        >
          @{handle}
        </p>

        <div>
          <p
            className="font-bold uppercase leading-[0.92] tracking-tight"
            style={{
              fontSize: "clamp(1.5rem, 7vw, 3rem)",
              background: palette.nameGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {primary}
          </p>
          {secondary ? (
            <p
              className="mt-0.5 text-[0.72em] font-semibold uppercase tracking-tight"
              style={{ color: palette.secondaryColor }}
            >
              {secondary}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

type ProfileDefaultBannerProps = {
  displayName: string
  username?: string
  className?: string
}

export function ProfileDefaultBanner({ displayName, username, className }: ProfileDefaultBannerProps) {
  const theme = getBannerTheme(displayName, username)
  const { palette } = theme
  const glowX =
    theme.glowSide === "right"
      ? palette.glowX
      : `${100 - parseInt(palette.glowX, 10)}%`

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-white", className)} aria-hidden>
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
        <defs>
          <filter id={BANNER_NOISE_FILTER_ID} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
            <feComponentTransfer in="grey" result="balanced">
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0" style={{ background: palette.base }} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 85% 110% at ${glowX} -5%, ${palette.glow} 0%, transparent 58%)`,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background: `radial-gradient(ellipse 50% 60% at ${theme.glowSide === "right" ? "12%" : "88%"} 90%, ${palette.accentMuted} 0%, transparent 50%)`,
        }}
        aria-hidden
      />

      <BannerSoundWave
        seed={theme.waveSeed}
        side={theme.glowSide}
        gradientId={theme.waveGradientId}
        accent={palette.accent}
      />

      <HeroArtistName displayName={displayName} username={username} palette={palette} />

      {/* Avatar + profile UI safe zone */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-background from-15% via-background/90 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-background from-20% via-background/80 to-transparent"
        aria-hidden
      />

      <BannerNoise />
    </div>
  )
}

type ProfileCoverBannerProps = {
  coverUrl?: string | null
  coverAlt?: string
  displayName: string
  username?: string
}

export function ProfileCoverBanner({
  coverUrl,
  coverAlt = "",
  displayName,
  username,
}: ProfileCoverBannerProps) {
  const name = displayName.trim() || username?.trim() || "Artist"

  return (
    <div className="relative h-32 w-full overflow-hidden border-b border-border/25 sm:h-40 md:h-48 lg:h-64">
      {coverUrl ? (
        <img src={coverUrl} alt={coverAlt} className="h-full w-full object-cover" />
      ) : (
        <ProfileDefaultBanner displayName={name} username={username} />
      )}
    </div>
  )
}
