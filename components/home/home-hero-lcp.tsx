import { fetchCuratedHeroCards } from "@/lib/home/fetch-curated-hero"
import { mapVideosToHeroCards } from "@/lib/home/hero-carousel-data"
import { fetchHomeFeedInitial } from "@/lib/seo/fetch-public"

/**
 * First hero poster in the server HTML, straight from Workers.
 * The client carousel replaces this once its own cards are ready.
 */
export async function HomeHeroLcp() {
  const curated = await fetchCuratedHeroCards(1)
  let thumbnail = curated.cards[0]?.thumbnail || ""
  let title = curated.cards[0]?.title || ""

  if (!thumbnail) {
    const videos = await fetchHomeFeedInitial(1, "hiffi_home_v1")
    const fallback = mapVideosToHeroCards(videos as unknown as Array<Record<string, unknown>>, 1)[0]
    thumbnail = fallback?.thumbnail || ""
    title = fallback?.title || ""
  }

  if (!thumbnail) return null

  return (
    <>
      <link rel="preload" as="image" href={thumbnail} fetchPriority="high" />
      <div
        className="relative w-full overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-black/10 sm:rounded-2xl aspect-[16/9] max-h-[232px] sm:max-h-[248px] md:aspect-[21/9] md:max-h-[min(46svh,460px)]"
        data-home-hero-lcp
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnail}
          alt={title ? `${title} — video thumbnail` : ""}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-[center_30%] md:object-center"
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-black via-black/75 to-transparent md:w-[68%] md:via-black/70"
          aria-hidden
        />
      </div>
    </>
  )
}
