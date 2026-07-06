import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { artistIndexCitySceneHref } from "@/lib/artist-directory"
import { getAtlantaSceneTeaser } from "@/lib/artist-index/city-seo-content"

type ArtistCitySceneTeaserProps = {
  citySlug: string
  cityLabel: string
  profileCount: number
}

export function ArtistCitySceneTeaser({
  citySlug,
  cityLabel,
  profileCount,
}: ArtistCitySceneTeaserProps) {
  if (citySlug !== "atlanta") return null

  return (
    <aside className="rounded-2xl border border-border/80 bg-muted/15 px-5 py-5 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        About the {cityLabel} scene
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        {getAtlantaSceneTeaser(profileCount)}
      </p>
      <Link
        href={artistIndexCitySceneHref(citySlug)}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E8192C] transition-colors hover:text-[#d01528]"
      >
        Read the Atlanta hip-hop scene guide
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  )
}
