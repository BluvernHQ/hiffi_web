import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { artistButtonOutline, artistButtonSolid } from "@/components/artists/artist-styles"
import { cn } from "@/lib/utils"

type ArtistClaimCtaProps = {
  artist: Artist
  variant?: "sidebar" | "banner"
  className?: string
}

export function ArtistClaimCta({ artist, variant = "sidebar", className }: ArtistClaimCtaProps) {
  const claimHref = `/artist-index/${artist.slug}/claim`
  const isUnclaimed = artist.claim_status === "unclaimed"

  if (variant === "banner") {
    return (
      <section
        className={cn(
          "rounded-2xl bg-[#E8192C] px-6 py-10 text-center text-white sm:px-10 sm:py-12",
          className,
        )}
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Are You an Artist?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
          Join our elite community and showcase your talent to the world. Get discovered by fans and
          industry leaders.
        </p>
        <Link
          href={isUnclaimed ? claimHref : "/artist-index"}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#E8192C] transition-colors hover:bg-white/90"
        >
          Claim Your Profile Now
        </Link>
      </section>
    )
  }

  return (
    <aside
      className={cn(
        "rounded-2xl border border-[#E8192C]/15 bg-rose-50/60 p-6",
        isUnclaimed && "ring-1 ring-[#E8192C]/10",
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-[#E8192C]">Is this your profile?</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Claim your profile to update your imagery, add social links, and manage your video gallery.
      </p>
      <Link
        href={claimHref}
        className={cn("mt-5 w-full", isUnclaimed ? artistButtonSolid : artistButtonOutline)}
      >
        {isUnclaimed ? "Claim or Update Profile" : "Update Profile"}
      </Link>
    </aside>
  )
}
