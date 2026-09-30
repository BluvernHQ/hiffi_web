"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  BadgeCheck,
  Check,
  Globe,
  Instagram,
  Link2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Music2,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api-client"
import { CLAIM_UNDER_REVIEW_MESSAGE, isClaimUnderReviewError } from "@/lib/api/inventory"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  cn,
  getAvatarLetter,
  getColorFromName,
  getProfilePictureProxyUrl,
  getProfilePictureUrl,
} from "@/lib/utils"
import { getArtistImageUrl } from "@/lib/artist-directory"

const BIO_MAX = 2000

const NAV_ITEMS = [
  { id: "section-artwork", label: "Header & Artwork" },
  { id: "section-about", label: "About & Bio" },
  { id: "section-streaming", label: "Streaming Platforms" },
  { id: "section-social", label: "Social Profiles" },
] as const

type NavSectionId = (typeof NAV_ITEMS)[number]["id"]

export type EditArtistProfileFormProps = {
  currentName: string
  currentUsername: string
  currentEmail?: string
  currentBio?: string
  currentLocation?: string
  currentWebsite?: string
  currentInstagram?: string
  currentYoutube?: string
  currentTiktok?: string
  currentFacebook?: string
  currentSpotify?: string
  currentAppleMusic?: string
  currentSoundcloud?: string
  currentProfilePicture?: string
  currentBannerImage?: string
  genreLabel?: string
  verified?: boolean
  onOpenPictureEditor?: () => void
  onOpenBannerEditor?: () => void
  onProfileUpdated?: () => void | Promise<void>
}

function pickSocial(
  ...values: Array<string | null | undefined>
): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim()
  }
  return ""
}

function SectionCard({
  id,
  step,
  title,
  description,
  children,
}: {
  id: string
  step: number
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 rounded-xl border border-border bg-white p-3 shadow-sm sm:scroll-mt-6 sm:rounded-2xl sm:p-6"
    >
      <div className="flex items-start gap-2.5 border-b border-border pb-3 sm:gap-3 sm:pb-4">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E8192C]/10 text-xs font-bold text-[#E8192C] sm:h-8 sm:w-8 sm:text-sm">
          {step}
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">{children}</div>
    </section>
  )
}

function FieldShell({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function EditArtistProfileForm({
  currentName,
  currentUsername,
  currentEmail = "",
  currentBio = "",
  currentLocation = "",
  currentWebsite = "",
  currentInstagram = "",
  currentYoutube = "",
  currentTiktok = "",
  currentFacebook = "",
  currentSpotify = "",
  currentAppleMusic = "",
  currentSoundcloud = "",
  currentProfilePicture = "",
  currentBannerImage = "",
  genreLabel = "Rap / Hip-Hop",
  verified = false,
  onOpenPictureEditor,
  onOpenBannerEditor,
  onProfileUpdated,
}: EditArtistProfileFormProps) {
  const [name, setName] = useState(currentName)
  const [email, setEmail] = useState(currentEmail)
  const [bio, setBio] = useState(currentBio)
  const [location, setLocation] = useState(currentLocation)
  const [website, setWebsite] = useState(currentWebsite)
  const [instagram, setInstagram] = useState(currentInstagram)
  const [youtube, setYoutube] = useState(currentYoutube)
  const [tiktok, setTiktok] = useState(currentTiktok)
  const [facebook, setFacebook] = useState(currentFacebook)
  const [spotify, setSpotify] = useState(currentSpotify)
  const [appleMusic, setAppleMusic] = useState(currentAppleMusic)
  const [soundcloud, setSoundcloud] = useState(currentSoundcloud)
  const [activeSection, setActiveSection] = useState<NavSectionId>(NAV_ITEMS[0].id)
  const [isLoading, setIsLoading] = useState(false)
  const [otpId, setOtpId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const chipsScrollRef = useRef<HTMLDivElement>(null)
  const scrollingToRef = useRef<NavSectionId | null>(null)
  const router = useRouter()
  const { refreshUserData } = useAuth()
  const { toast } = useToast()
  const profileHref = `/profile/${encodeURIComponent(currentUsername)}`

  const resetForm = () => {
    setName(currentName)
    setEmail(currentEmail || "")
    setBio(currentBio || "")
    setLocation(currentLocation || "")
    setWebsite(currentWebsite || "")
    setInstagram(currentInstagram || "")
    setYoutube(currentYoutube || "")
    setTiktok(currentTiktok || "")
    setFacebook(currentFacebook || "")
    setSpotify(currentSpotify || "")
    setAppleMusic(currentAppleMusic || "")
    setSoundcloud(currentSoundcloud || "")
    setOtpId(null)
    setOtp("")
    setIsVerifying(false)
    setActiveSection(NAV_ITEMS[0].id)
  }

  useEffect(() => {
    resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentName,
    currentEmail,
    currentBio,
    currentLocation,
    currentWebsite,
    currentInstagram,
    currentYoutube,
    currentTiktok,
    currentFacebook,
    currentSpotify,
    currentAppleMusic,
    currentSoundcloud,
  ])

  const snapshot = useMemo(
    () => ({
      name: currentName.trim(),
      email: (currentEmail || "").trim(),
      bio: (currentBio || "").trim(),
      location: (currentLocation || "").trim(),
      website: (currentWebsite || "").trim(),
      instagram: (currentInstagram || "").trim(),
      youtube: (currentYoutube || "").trim(),
      tiktok: (currentTiktok || "").trim(),
      facebook: (currentFacebook || "").trim(),
      spotify: (currentSpotify || "").trim(),
      appleMusic: (currentAppleMusic || "").trim(),
      soundcloud: (currentSoundcloud || "").trim(),
    }),
    [
      currentName,
      currentEmail,
      currentBio,
      currentLocation,
      currentWebsite,
      currentInstagram,
      currentYoutube,
      currentTiktok,
      currentFacebook,
      currentSpotify,
      currentAppleMusic,
      currentSoundcloud,
    ],
  )

  const draft = {
    name: name.trim(),
    email: email.trim(),
    bio: bio.trim(),
    location: location.trim(),
    website: website.trim(),
    instagram: instagram.trim(),
    youtube: youtube.trim(),
    tiktok: tiktok.trim(),
    facebook: facebook.trim(),
    spotify: spotify.trim(),
    appleMusic: appleMusic.trim(),
    soundcloud: soundcloud.trim(),
  }

  const hasChanges = (Object.keys(draft) as Array<keyof typeof draft>).some(
    (key) => draft[key] !== snapshot[key],
  )
  const emailChanged = draft.email !== snapshot.email

  const bannerPreviewSrc = useMemo(
    () => getArtistImageUrl(currentBannerImage) || null,
    [currentBannerImage],
  )

  const completionChecks = [
    Boolean(currentProfilePicture?.trim()),
    Boolean(currentBannerImage?.trim()),
    Boolean(name.trim()),
    Boolean(bio.trim()),
    Boolean(location.trim()),
    Boolean(
      instagram.trim() || youtube.trim() || tiktok.trim() || facebook.trim(),
    ),
    Boolean(
      spotify.trim() || appleMusic.trim() || soundcloud.trim() || website.trim(),
    ),
  ]
  const completion = Math.round(
    (completionChecks.filter(Boolean).length / completionChecks.length) * 100,
  )

  // Disable cache-busting: Date.now() otherwise changes the src on every keystroke and reloads the image.
  const avatarSrc = useMemo(() => {
    const baseUrl = getProfilePictureUrl(
      { profile_picture: currentProfilePicture, username: currentUsername },
      false,
    )
    return getProfilePictureProxyUrl(baseUrl) || undefined
  }, [currentProfilePicture, currentUsername])

  useEffect(() => {
    if (otpId) return

    let cancelled = false
    let detach: (() => void) | undefined

    const frame = requestAnimationFrame(() => {
      const root = mainScrollRef.current
      if (!root || cancelled) return

      const updateActiveFromScroll = () => {
        if (scrollingToRef.current) return

        const rootRect = root.getBoundingClientRect()
        const probe = rootRect.top + Math.min(140, rootRect.height * 0.35)
        let current: NavSectionId = NAV_ITEMS[0].id

        for (const item of NAV_ITEMS) {
          const el = document.getElementById(item.id)
          if (!el) continue
          const rect = el.getBoundingClientRect()
          // Active while this section covers the probe line, or its header has passed it.
          if (rect.top <= probe && rect.bottom > probe) {
            current = item.id
          } else if (rect.top <= probe) {
            current = item.id
          }
        }

        // Last section often can't scroll high enough — activate once its header is on screen,
        // or when the scrollport is near the bottom.
        const lastId = NAV_ITEMS[NAV_ITEMS.length - 1].id
        const lastEl = document.getElementById(lastId)
        if (lastEl) {
          const lastTop = lastEl.getBoundingClientRect().top
          const nearBottom =
            root.scrollHeight - root.scrollTop - root.clientHeight <= 96
          if (nearBottom || lastTop <= rootRect.top + rootRect.height * 0.45) {
            current = lastId
          }
        }

        setActiveSection((prev) => (prev === current ? prev : current))
      }

      root.addEventListener("scroll", updateActiveFromScroll, { passive: true })
      updateActiveFromScroll()
      detach = () => root.removeEventListener("scroll", updateActiveFromScroll)
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      detach?.()
    }
  }, [otpId])

  useEffect(() => {
    const container = chipsScrollRef.current
    if (!container) return
    const active = container.querySelector<HTMLElement>(
      `[data-section-chip="${activeSection}"]`,
    )
    if (!active) return

    const nextLeft =
      active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2
    container.scrollTo({
      left: Math.max(0, nextLeft),
      behavior: "smooth",
    })
  }, [activeSection])

  const scrollToSection = (id: NavSectionId) => {
    const root = mainScrollRef.current
    const el = document.getElementById(id)
    if (!root || !el) return

    setActiveSection(id)
    scrollingToRef.current = id

    const nextTop =
      root.scrollTop +
      (el.getBoundingClientRect().top - root.getBoundingClientRect().top) -
      12
    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" })

    window.setTimeout(() => {
      if (scrollingToRef.current === id) scrollingToRef.current = null
    }, 800)
  }

  const handleClose = () => {
    if (isLoading || isVerifying) return
    router.push(profileHref)
  }

  const handleDiscard = () => {
    resetForm()
    toast({ title: "Changes discarded" })
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      })
      return
    }

    if (!hasChanges) {
      toast({
        title: "No changes",
        description: "Please make at least one change before saving.",
      })
      return
    }

    setIsLoading(true)
    try {
      const updateData: Record<string, string> = {}
      if (draft.name !== snapshot.name) updateData.name = draft.name
      if (emailChanged) updateData.email = draft.email
      if (draft.bio !== snapshot.bio) updateData.bio = draft.bio
      if (draft.location !== snapshot.location) updateData.location = draft.location
      if (draft.website !== snapshot.website) updateData.website = draft.website
      if (draft.instagram !== snapshot.instagram) updateData.instagram = draft.instagram
      if (draft.youtube !== snapshot.youtube) updateData.youtube = draft.youtube
      if (draft.tiktok !== snapshot.tiktok) updateData.tiktok = draft.tiktok
      if (draft.facebook !== snapshot.facebook) updateData.facebook = draft.facebook
      if (draft.spotify !== snapshot.spotify) updateData.spotify = draft.spotify
      if (draft.appleMusic !== snapshot.appleMusic) updateData.apple_music = draft.appleMusic
      if (draft.soundcloud !== snapshot.soundcloud) updateData.soundcloud = draft.soundcloud

      const response = await apiClient.updateSelfUser(updateData)

      if (emailChanged && response?.data?.id) {
        setOtpId(response.data.id)
        toast({
          title: "OTP sent",
          description: response.data.message || "Check your email for the verification code.",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      try {
        await Promise.all([refreshUserData(true), onProfileUpdated?.()])
      } catch (error) {
        console.error("[hiffi] Error refreshing profile data:", error)
      }
      router.push(profileHref)
      router.refresh()
    } catch (error: any) {
      if (isClaimUnderReviewError(error)) {
        toast({
          title: "Under review",
          description: "You can change your email once the Hiffi team approves your claim. Your other edits can be saved without it.",
        })
        return
      }
      toast({
        title: "Update failed",
        description: error?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpId) return
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP code.",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)
    try {
      const response = await apiClient.verifyEmailUpdate({ id: otpId, otp })
      if (!response.success) throw new Error(response.error || "OTP verification failed")
      toast({
        title: "Email verified",
        description: "Your email has been successfully updated.",
      })
      try {
        await Promise.all([refreshUserData(true), onProfileUpdated?.()])
      } catch (error) {
        console.error("[hiffi] Error refreshing profile data:", error)
      }
      router.push(profileHref)
      router.refresh()
    } catch (error: any) {
      if (isClaimUnderReviewError(error)) {
        toast({ title: "Under review", description: CLAIM_UNDER_REVIEW_MESSAGE })
        setOtpId(null)
        return
      }
      toast({
        title: "Verification failed",
        description: error?.message || "OTP verification failed. Please try again.",
        variant: "destructive",
      })
      setOtp("")
    } finally {
      setIsVerifying(false)
    }
  }

  if (otpId) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Verify your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code to {email}. Enter it below to finish updating your email.
          </p>
          <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="off"
                required
                maxLength={6}
                className="text-center font-mono text-2xl tracking-widest"
                autoFocus
                disabled={isVerifying}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOtpId(null)
                  setOtp("")
                }}
                disabled={isVerifying}
              >
                Back
              </Button>
              <Button type="submit" disabled={isVerifying || otp.length !== 6}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
        <form
          onSubmit={handleSubmit}
          className="flex h-full min-h-0 max-h-full flex-1 flex-col overflow-hidden bg-[#f7f7f8]"
        >
          {/* Top bar */}
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-white px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-lg">
                Edit Artist Profile
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isLoading}
                className="hidden sm:inline-flex"
              >
                Back to Profile
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClose}
                disabled={isLoading}
                className="h-9 w-9 sm:hidden"
                aria-label="Back to profile"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* Desktop sidebar / mobile summary */}
            <aside className="shrink-0 border-b border-border bg-white lg:flex lg:h-full lg:w-72 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-80">
              <div className="space-y-3 p-3 sm:space-y-4 sm:p-5 lg:flex-1">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-[#fafafa] p-2.5 sm:rounded-2xl sm:p-3">
                  <Avatar className="h-11 w-11 border border-border shadow-sm sm:h-14 sm:w-14">
                    <AvatarImage src={avatarSrc} alt="" />
                    <AvatarFallback
                      className="font-semibold text-white"
                      style={{
                        backgroundColor: getColorFromName(currentName || currentUsername),
                      }}
                    >
                      {getAvatarLetter({ name: currentName, username: currentUsername }, "U")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                      {name.trim() || currentUsername}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{genreLabel}</p>
                    {verified ? (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[#4F7AE1] sm:mt-1 sm:text-[11px]">
                        <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                        Verified Official
                      </span>
                    ) : (
                      <span className="mt-0.5 inline-flex text-[10px] font-medium text-muted-foreground sm:mt-1 sm:text-[11px]">
                        @{currentUsername}
                      </span>
                    )}
                  </div>
                  {/* Compact completion on mobile next to identity */}
                  <div className="w-14 shrink-0 text-center lg:hidden">
                    <p className="text-[10px] font-semibold tabular-nums text-foreground">{completion}%</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[#E8192C] transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden rounded-2xl border border-border p-3 lg:block">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Profile completion</span>
                    <span className="tabular-nums text-foreground">{completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#E8192C] transition-all"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {completion === 100
                      ? "Looking sharp — profile is complete."
                      : "Add bio, location, and links to finish your profile."}
                  </p>
                </div>

                <nav className="hidden space-y-1 lg:block" aria-label="Edit sections">
                  {NAV_ITEMS.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                        activeSection === item.id
                          ? "bg-[#E8192C]/10 font-semibold text-[#E8192C]"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200",
                          activeSection === item.id
                            ? "bg-[#E8192C] text-white"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </span>
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="hidden rounded-2xl border border-dashed border-border bg-[#fafafa] p-4 text-sm lg:block">
                  <p className="font-semibold text-foreground">Need assistance?</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Changes save to your Hiffi profile. Contact support if something looks wrong.
                  </p>
                  <a
                    href="/contact"
                    className="mt-3 inline-flex text-xs font-semibold text-[#E8192C] hover:underline"
                  >
                    Contact Artist Support
                  </a>
                </div>
              </div>
            </aside>

            {/* Mobile section chips — sticky under summary */}
            <div className="shrink-0 border-b border-border bg-white px-3 py-2 lg:hidden">
              <div
                ref={chipsScrollRef}
                className="-mx-1 flex gap-2 overflow-x-auto scroll-smooth px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {NAV_ITEMS.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    data-section-chip={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      activeSection === item.id
                        ? "border-[#E8192C] bg-[#E8192C] text-white"
                        : "border-border bg-white text-muted-foreground",
                    )}
                  >
                    <span className="mr-1 tabular-nums opacity-70">{index + 1}.</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main */}
            <div
              ref={mainScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
            >
              <div className="mx-auto w-full max-w-3xl space-y-3 px-3 py-3 sm:space-y-5 sm:px-6 sm:py-6 lg:max-w-4xl">
                <div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      Edit Artist Profile
                    </h3>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="mt-1 text-sm font-medium text-[#E8192C] hover:underline"
                    >
                      Back to Artist Profile
                    </button>
                  </div>
                  <div className="inline-flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 sm:max-w-xs">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>Changes sync to your public Hiffi profile as soon as you save.</span>
                  </div>
                </div>

                <SectionCard
                  id="section-artwork"
                  step={1}
                  title="Header Banner & Identity Artwork"
                  description="Update the banner and avatar fans see on your profile."
                >
                  <div className="overflow-hidden rounded-xl border border-border sm:rounded-2xl">
                    <div className="relative aspect-[3/1] w-full bg-gradient-to-br from-[#E8192C]/80 via-[#8b0f1c] to-zinc-900">
                      {bannerPreviewSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={bannerPreviewSrc}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                      <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/50 to-transparent p-3 sm:p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 sm:text-xs">
                          Profile banner
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8 rounded-full bg-white/90 text-xs font-semibold text-foreground hover:bg-white"
                          onClick={() => onOpenBannerEditor?.()}
                          disabled={!onOpenBannerEditor || isLoading}
                        >
                          {bannerPreviewSrc ? "Change banner" : "Upload banner"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border border-border bg-[#fafafa] p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="h-14 w-14 shrink-0 border-2 border-white shadow-md sm:h-20 sm:w-20">
                        <AvatarImage src={avatarSrc} alt="" />
                        <AvatarFallback
                          className="text-base font-bold text-white sm:text-lg"
                          style={{
                            backgroundColor: getColorFromName(currentName || currentUsername),
                          }}
                        >
                          {getAvatarLetter({ name: currentName, username: currentUsername }, "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground sm:text-base">Artist avatar photo</p>
                        <p className="text-[11px] text-muted-foreground sm:text-xs">
                          Square image works best for cards and the profile hero.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() => onOpenPictureEditor?.()}
                      disabled={!onOpenPictureEditor}
                    >
                      Upload New Photo
                    </Button>
                  </div>
                </SectionCard>

                <SectionCard
                  id="section-about"
                  step={2}
                  title="About & Bio Information"
                  description="Tell fans who you are and where you’re from."
                >
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    <FieldShell
                      label="Artist name"
                      htmlFor="edit-name"
                      hint="Shown on your public profile."
                    >
                      <Input
                        id="edit-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        className="h-11 rounded-xl"
                      />
                    </FieldShell>

                    <FieldShell
                      label="Username"
                      htmlFor="edit-username"
                      hint="Username cannot be changed."
                    >
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-username"
                          value={currentUsername}
                          disabled
                          className="h-11 rounded-xl bg-muted pl-9"
                        />
                      </div>
                    </FieldShell>

                    <FieldShell label="Primary sound / genre" htmlFor="edit-genre">
                      <Input
                        id="edit-genre"
                        value={genreLabel}
                        disabled
                        className="h-11 rounded-xl bg-muted"
                      />
                    </FieldShell>

                    <FieldShell label="City / location" htmlFor="edit-location">
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="edit-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Atlanta, GA"
                          disabled={isLoading}
                          className="h-11 rounded-xl pl-9"
                        />
                      </div>
                    </FieldShell>
                  </div>

                  <FieldShell
                    label="Email"
                    htmlFor="edit-email"
                    hint="Used for account notifications. Changing email requires OTP verification."
                  >
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="edit-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        disabled={isLoading}
                        className="h-11 rounded-xl pl-9"
                      />
                    </div>
                  </FieldShell>

                  <FieldShell label="Artist bio" htmlFor="edit-bio">
                    <Textarea
                      id="edit-bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
                      placeholder="Tell fans about your sound, story, and what’s next."
                      disabled={isLoading}
                      rows={4}
                      maxLength={BIO_MAX}
                      className="min-h-[6.5rem] rounded-xl sm:min-h-[8rem]"
                    />
                    <p className="text-right text-xs tabular-nums text-muted-foreground">
                      {bio.length}/{BIO_MAX}
                    </p>
                  </FieldShell>
                </SectionCard>

                <SectionCard
                  id="section-streaming"
                  step={3}
                  title="Streaming Platforms"
                  description="Official pages where fans can listen."
                >
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  {(
                    [
                      ["youtube", "YouTube", youtube, setYoutube, Music2],
                      ["spotify", "Spotify", spotify, setSpotify, Music2],
                      ["appleMusic", "Apple Music", appleMusic, setAppleMusic, Music2],
                      ["soundcloud", "SoundCloud", soundcloud, setSoundcloud, Music2],
                      ["website", "Website", website, setWebsite, Globe],
                    ] as const
                  ).map(([key, label, value, setter, Icon]) => (
                    <FieldShell
                      key={key}
                      label={label}
                      htmlFor={`edit-${key}`}
                    >
                      <div className="relative">
                        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id={`edit-${key}`}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="https://"
                          disabled={isLoading}
                          className="h-11 rounded-xl pl-9"
                        />
                      </div>
                    </FieldShell>
                  ))}
                  </div>
                </SectionCard>

                <SectionCard
                  id="section-social"
                  step={4}
                  title="Social Profiles"
                  description="Where fans can follow you day to day."
                >
                  <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                    {(
                      [
                        ["instagram", "Instagram", instagram, setInstagram, Instagram],
                        ["tiktok", "TikTok", tiktok, setTiktok, Link2],
                        ["facebook", "Facebook", facebook, setFacebook, Globe],
                      ] as const
                    ).map(([key, label, value, setter, Icon]) => (
                      <FieldShell
                        key={key}
                        label={label}
                        htmlFor={`edit-${key}`}
                      >
                        <div className="relative">
                          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id={`edit-${key}`}
                            value={value}
                            onChange={(e) => setter(e.target.value)}
                            placeholder="https://"
                            disabled={isLoading}
                            className="h-11 rounded-xl pl-9"
                          />
                        </div>
                      </FieldShell>
                    ))}
                  </div>
                </SectionCard>

                <div className="h-28 sm:h-16" aria-hidden />
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <footer className="flex shrink-0 flex-col gap-2 border-t border-border bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-3 sm:pb-3">
            <p className="hidden text-xs text-muted-foreground sm:block sm:max-w-md">
              Keep it accurate and respectful. Misleading links or stolen media may be removed.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleDiscard}
                disabled={isLoading || !hasChanges}
                className="h-10 flex-1 sm:h-9 sm:flex-none"
              >
                Discard
              </Button>
              <Button
                type="submit"
                disabled={!hasChanges || isLoading}
                className="h-10 flex-1 bg-[#E8192C] hover:bg-[#d01528] sm:h-9 sm:flex-none sm:min-w-[160px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : emailChanged ? (
                  "Send OTP & Save"
                ) : (
                  <>
                    <span className="sm:hidden">Save</span>
                    <span className="hidden sm:inline">Save All Changes</span>
                  </>
                )}
              </Button>
            </div>
          </footer>
        </form>
  )
}

/** Helpers for call sites mapping profile/artist socials into form props. */
export function socialsFromProfile(user: Record<string, unknown> | null | undefined) {
  if (!user) {
    return {
      currentLocation: "",
      currentWebsite: "",
      currentInstagram: "",
      currentYoutube: "",
      currentTiktok: "",
      currentFacebook: "",
      currentSpotify: "",
      currentAppleMusic: "",
      currentSoundcloud: "",
    }
  }
  const other =
    user.other_socials && typeof user.other_socials === "object" && !Array.isArray(user.other_socials)
      ? (user.other_socials as Record<string, unknown>)
      : {}
  return {
    currentLocation: pickSocial(user.location as string),
    currentWebsite: pickSocial(
      user.website as string,
      user.website_url as string,
      other.website as string,
    ),
    currentInstagram: pickSocial(
      user.instagram as string,
      user.instagram_url as string,
      other.instagram as string,
    ),
    currentYoutube: pickSocial(
      user.youtube as string,
      user.youtube_url as string,
      other.youtube as string,
    ),
    currentTiktok: pickSocial(
      user.tiktok as string,
      user.tiktok_url as string,
      other.tiktok as string,
    ),
    currentFacebook: pickSocial(
      user.facebook as string,
      user.facebook_url as string,
      other.facebook as string,
    ),
    currentSpotify: pickSocial(
      user.spotify as string,
      user.spotify_url as string,
      other.spotify as string,
    ),
    currentAppleMusic: pickSocial(
      user.apple_music as string,
      user.appleMusic as string,
      other.apple_music as string,
    ),
    currentSoundcloud: pickSocial(user.soundcloud as string, other.soundcloud as string),
  }
}
