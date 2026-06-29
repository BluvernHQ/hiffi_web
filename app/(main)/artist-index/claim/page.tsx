import { JsonLd } from "@/components/seo/json-ld"
import { ArtistClaimLanding } from "@/components/artists/ArtistClaimLanding"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import {
  buildArtistClaimLandingJsonLd,
  buildArtistClaimLandingMetadata,
} from "@/lib/artist-index/claim-landing-seo"
import { artistIndexCityHref } from "@/lib/artist-directory"
import { getArtistCount } from "@/lib/artists"

export const metadata = buildArtistClaimLandingMetadata()

export default async function ArtistClaimLandingPage() {
  const artistCount = await getArtistCount()

  return (
    <ArtistDirectoryShell
      breadcrumbs={[
        { label: "Artist Index", href: "/artist-index" },
        { label: "Claim profile" },
      ]}
      claimHref={artistIndexCityHref("atlanta")}
      claimLabel="Browse artists"
    >
      <JsonLd data={buildArtistClaimLandingJsonLd(artistCount)} />
      <ArtistClaimLanding artistCount={artistCount} />
    </ArtistDirectoryShell>
  )
}
