import { getArtistCount, getArtists } from "@/lib/artists"
import { ArtistIndexHeader } from "@/components/artists/ArtistIndexHeader"
import { ArtistIndexListing } from "@/components/artists/ArtistIndexListing"
import { SiteFooter } from "@/components/layout/site-footer"

function formatLastUpdated(): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date())
}

export default function ArtistIndexPage() {
  const artists = getArtists()
  const artistCount = getArtistCount()

  return (
    <div className="min-h-screen bg-white">
      <ArtistIndexHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <ArtistIndexListing
          artists={artists}
          artistCount={artistCount}
          lastUpdated={formatLastUpdated()}
        />
      </main>
      <SiteFooter />
    </div>
  )
}
