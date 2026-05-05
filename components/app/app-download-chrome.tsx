"use client"

import { useEffect, useId, useState, type ReactNode } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Anton, Special_Elite } from "next/font/google"
import { AppleAppStoreIcon, GooglePlayStoreIcon } from "@/components/app/store-platform-icons"
import { cn } from "@/lib/utils"
import { HIFFI_APP_STORE_URL, HIFFI_PLAY_STORE_URL } from "@/lib/app-download"

type OsState = "pending" | "desktop" | "ios" | "android" | "other-mobile"
export type PlatformHint = "ios" | "android" | "unknown"

const heroDisplayFont = Anton({ subsets: ["latin"], weight: "400" })
const editorialMonoFont = Special_Elite({ subsets: ["latin"], weight: "400" })

const PLATFORM_SESSION_KEY = "hiffi_platform"
const PLATFORM_COOKIE_KEY = "hiffi_platform"
const PLATFORM_COOKIE_MAX_AGE_SECONDS = 60 * 30

function parsePlatform(value: string | null | undefined): "ios" | "android" | null {
  if (value === "ios" || value === "android") return value
  return null
}

function writePlatformCache(platform: "ios" | "android") {
  try {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PLATFORM_SESSION_KEY, platform)
      document.cookie = `${PLATFORM_COOKIE_KEY}=${platform}; Max-Age=${PLATFORM_COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
    }
  } catch {
    // no-op
  }
}

function readSessionPlatform(): "ios" | "android" | null {
  try {
    if (typeof window === "undefined") return null
    return parsePlatform(sessionStorage.getItem(PLATFORM_SESSION_KEY))
  } catch {
    return null
  }
}

function detectOs(): OsState {
  if (typeof window === "undefined") return "pending"
  if (window.matchMedia("(min-width: 768px)").matches) return "desktop"
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "other-mobile"
}

type StoreVisual = "equal" | "ios-primary" | "android-primary"

function useDownloadOsState(initialPlatform: PlatformHint) {
  const initialOs: OsState = initialPlatform === "unknown" ? "pending" : initialPlatform
  const [os, setOs] = useState<OsState>(initialOs)
  const [showAllStores, setShowAllStores] = useState(false)
  const [isResolving, setIsResolving] = useState(initialOs === "pending")

  useEffect(() => {
    const sessionPlatform = readSessionPlatform()
    if (sessionPlatform) {
      setOs(sessionPlatform)
      setIsResolving(false)
    }

    const applyDetectedPlatform = () => {
      const detected = detectOs()
      setOs((prev) => (prev === detected ? prev : detected))
      setIsResolving(false)
      if (detected === "ios" || detected === "android") {
        writePlatformCache(detected)
      }
    }

    applyDetectedPlatform()
    const mq = window.matchMedia("(min-width: 768px)")
    const onChange = () => applyDetectedPlatform()
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const hydrated = os !== "pending"
  const isDesktop = os === "desktop"
  const isIos = os === "ios"
  const isAndroid = os === "android"
  const showToggle = hydrated && !isDesktop && (isIos || isAndroid) && !showAllStores

  let visual: StoreVisual = "equal"
  if (hydrated && !showAllStores) {
    if (isDesktop || os === "other-mobile") visual = "equal"
    else if (isIos) visual = "ios-primary"
    else if (isAndroid) visual = "android-primary"
  }

  return { os, showAllStores, setShowAllStores, showToggle, visual, isDesktop, hydrated, isResolving }
}

const pillBase =
  "inline-flex w-full min-h-[52px] items-center justify-center gap-3 border-2 px-6 py-3.5 text-sm font-semibold uppercase tracking-wide transition-all duration-150 md:w-auto md:min-w-[230px]"

function storeButtonCopy(visual: StoreVisual) {
  if (visual === "ios-primary") {
    return {
      playFirst: false,
      apple: { text: "Download on the App Store", ariaLabel: "Download Hiffi from the App Store" },
      play: { text: "View on Google Play", ariaLabel: "View Hiffi on Google Play" },
    }
  }
  if (visual === "android-primary") {
    return {
      playFirst: true,
      apple: { text: "View on App Store", ariaLabel: "View Hiffi on the App Store" },
      play: { text: "Get it on Google Play", ariaLabel: "Download Hiffi from Google Play" },
    }
  }
  return {
    playFirst: false,
    apple: { text: "Download on the App Store", ariaLabel: "Download on the App Store" },
    play: { text: "Get it on Google Play", ariaLabel: "Get it on Google Play" },
  }
}

function StoreLink({
  href,
  visual,
  store,
  text,
  ariaLabel,
}: {
  href: string
  visual: StoreVisual
  store: "apple" | "play"
  text: string
  ariaLabel: string
}) {
  const isApple = store === "apple"
  const primary =
    visual === "equal" ||
    (visual === "ios-primary" && isApple) ||
    (visual === "android-primary" && !isApple)

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={cn(
        pillBase,
        primary
          ? "border-black bg-black text-white shadow-[7px_7px_0_#DA291C] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[6px_6px_0_#DA291C]"
          : "border-black bg-[#fffdf8] text-black shadow-[6px_6px_0_#111] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#f8f5ec]",
      )}
    >
      {isApple ? (
        <AppleAppStoreIcon className="h-7 w-7 shrink-0" fill="currentColor" />
      ) : (
        <GooglePlayStoreIcon className="h-7 w-7 shrink-0" />
      )}
      <span className="text-left leading-snug">{text}</span>
    </a>
  )
}

function StoreButtonRow({ visual }: { visual: StoreVisual }) {
  const copy = storeButtonCopy(visual)
  const appleLink = (
    <StoreLink
      href={HIFFI_APP_STORE_URL}
      visual={visual}
      store="apple"
      text={copy.apple.text}
      ariaLabel={copy.apple.ariaLabel}
    />
  )
  const playLink = (
    <StoreLink
      href={HIFFI_PLAY_STORE_URL}
      visual={visual}
      store="play"
      text={copy.play.text}
      ariaLabel={copy.play.ariaLabel}
    />
  )

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3 sm:max-w-none md:flex-row md:flex-wrap md:justify-center">
      {copy.playFirst ? (
        <>
          {playLink}
          {appleLink}
        </>
      ) : (
        <>
          {appleLink}
          {playLink}
        </>
      )}
    </div>
  )
}

function QrCard({
  label,
  url,
  ariaLabel,
}: {
  label: string
  url: string
  ariaLabel: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        aria-label={ariaLabel}
        className="rounded-xl bg-white p-4 shadow-lg ring-1 ring-black/5"
      >
        <QRCodeSVG value={url} size={168} level="M" includeMargin={false} />
      </div>
      <span className="text-sm font-medium text-black/90">{label}</span>
    </div>
  )
}

function NoiseOverlay({ filterId }: { filterId: string }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
      style={{ filter: `url(#${filterId})` }}
      aria-hidden
    />
  )
}

export function AppDownloadChrome({
  children,
  initialPlatform = "unknown",
}: {
  children: ReactNode
  initialPlatform?: PlatformHint
}) {
  const filterId = `app-noise-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  const { os, showAllStores, setShowAllStores, showToggle, visual, isDesktop, hydrated, isResolving } =
    useDownloadOsState(initialPlatform)

  const isIos = os === "ios"
  const isAndroid = os === "android"
  const showPlatformHero =
    hydrated && !isDesktop && (isIos || isAndroid) && !showAllStores

  const heroEyebrow = showPlatformHero
    ? isIos
      ? "App Store · iOS"
      : "Google Play · Android"
    : "Hiffi mobile"

  const heroDescription = showPlatformHero
    ? isIos
      ? "Built for iPhone and iPad: discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream in high quality — with updates through the App Store."
      : "Built for Android: discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream in high quality — install from Google Play with one tap."
    : "Discover independent hip-hop artists, watch music videos, follow creators, build playlists, and stream high-quality music on Hiffi."

  return (
    <>
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden>
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grey" />
            <feComponentTransfer in="grey" result="balanced">
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <header className="relative min-h-[min(100dvh,920px)] overflow-hidden border-b border-black/20 bg-[#f3f0e8] pb-16 pt-12 text-[#121212] md:pb-24 md:pt-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(0,0,0,0.08) 0, rgba(0,0,0,0) 40%), radial-gradient(circle at 85% 60%, rgba(0,0,0,0.07) 0, rgba(0,0,0,0) 38%)",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[length:100%_44px] opacity-30" aria-hidden />
        <NoiseOverlay filterId={filterId} />
        <p
          className={cn(
            "pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 select-none text-center text-[clamp(5rem,16vw,13rem)] leading-none tracking-[-0.04em] text-black/[0.06]",
            heroDisplayFont.className,
          )}
          aria-hidden
        >
          STREAM
        </p>

        <div className="relative z-[1] mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className={cn("transition-opacity duration-200", isResolving ? "opacity-95" : "opacity-100")}>
            <p className={cn("text-[12px] uppercase tracking-[0.3em] text-[#DA291C]", editorialMonoFont.className)}>
              {heroEyebrow}
            </p>

            {showPlatformHero && isIos ? (
              <h1
                className={cn(
                  "mx-auto mt-4 max-w-5xl text-[clamp(3.5rem,12vw,9rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-black",
                  heroDisplayFont.className,
                )}
              >
                Download <span className="text-[#DA291C]">Hiffi</span> for <span className="text-[#DA291C]">iPhone &amp; iPad</span>
              </h1>
            ) : showPlatformHero && isAndroid ? (
              <h1
                className={cn(
                  "mx-auto mt-4 max-w-5xl text-[clamp(3.5rem,12vw,9rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-black",
                  heroDisplayFont.className,
                )}
              >
                Download <span className="text-[#DA291C]">Hiffi</span> for <span className="text-[#DA291C]">Android</span>
              </h1>
            ) : (
              <h1
                className={cn(
                  "mx-auto mt-4 max-w-5xl text-[clamp(3.5rem,12vw,9rem)] font-bold uppercase leading-[0.92] tracking-[-0.04em] text-black",
                  heroDisplayFont.className,
                )}
              >
                Download <span className="text-[#DA291C]">Hiffi</span> for <span className="text-[#DA291C]">iOS</span> and{" "}
                <span className="text-[#DA291C]">Android</span>
              </h1>
            )}

            <p className={cn("mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-black/80 md:text-2xl", editorialMonoFont.className)}>
              {heroDescription}
            </p>

            {showPlatformHero && isIos && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-black/90">
                <span className="font-semibold text-black">Also on Android</span>
                {" — "}
                Hiffi is the same app on Google Play for phones and tablets.{" "}
                <a
                  href={HIFFI_PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#DA291C] underline-offset-2 hover:underline"
                >
                  View on Google Play
                </a>
                .
              </p>
            )}
            {showPlatformHero && isAndroid && (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-black/90">
                <span className="font-semibold text-black">Also on iPhone &amp; iPad</span>
                {" — "}
                The same Hiffi experience is on the App Store for iOS.{" "}
                <a
                  href={HIFFI_APP_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#DA291C] underline-offset-2 hover:underline"
                >
                  View on App Store
                </a>
                .
              </p>
            )}

            <div className="mt-10">
              <StoreButtonRow visual={visual} />
            </div>
          </div>

          {showToggle && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllStores(true)}
                className={cn("text-sm text-black/70 underline-offset-4 transition-colors hover:text-black hover:underline", editorialMonoFont.className)}
              >
                Not your device?
              </button>
            </div>
          )}
          {showAllStores && !isDesktop && (os === "ios" || os === "android") && (
            <p className={cn("mt-4 text-sm text-black/75", editorialMonoFont.className)}>Showing all download options.</p>
          )}

          <div className="mx-auto mt-16 hidden max-w-2xl md:block">
            <p className={cn("text-center text-[11px] uppercase tracking-[0.25em] text-[#DA291C]", editorialMonoFont.className)}>
              Scan to download
            </p>
            <p className={cn("mt-2 text-center text-sm text-black/75", editorialMonoFont.className)}>
              Scan the QR code with your phone to download Hiffi.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8">
              <QrCard
                label="App Store"
                url={HIFFI_APP_STORE_URL}
                ariaLabel="QR code to download Hiffi on the App Store"
              />
              <QrCard
                label="Google Play"
                url={HIFFI_PLAY_STORE_URL}
                ariaLabel="QR code to download Hiffi on Google Play"
              />
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-black/20 bg-[#ece8dd] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className={cn("text-[11px] uppercase tracking-[0.28em] text-[#DA291C]", editorialMonoFont.className)}>Get the app</p>
          <p className={cn("mt-3 text-3xl uppercase tracking-tight text-black md:text-5xl", heroDisplayFont.className)}>Ready to discover?</p>
          <p className={cn("mt-2 text-black/75", editorialMonoFont.className)}>Download Hiffi now.</p>
          <div className="mt-8 flex justify-center">
            <StoreButtonRow visual={visual} />
          </div>
        </div>
      </footer>
    </>
  )
}
