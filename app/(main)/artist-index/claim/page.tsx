import { JsonLd } from "@/components/seo/json-ld"
import { ArtistClaimLanding } from "@/components/artists/ArtistClaimLanding"
import { ArtistDirectoryShell } from "@/components/artists/ArtistDirectoryShell"
import {
  buildArtistClaimLandingJsonLd,
  buildArtistClaimLandingMetadata,
} from "@/lib/artist-index/claim-landing-seo"
import { ARTIST_INDEX_CLAIM_PATH } from "@/lib/artist-directory"
import { getArtistCount } from "@/lib/artists"

export const metadata = buildArtistClaimLandingMetadata()

export default async function ArtistClaimLandingPage() {
  const artistCount = await getArtistCount()

  return (
    <ArtistDirectoryShell
      claimHref={`${ARTIST_INDEX_CLAIM_PATH}#find-profile`}
      claimLabel="Claim Now"
    >
      <JsonLd data={buildArtistClaimLandingJsonLd(artistCount)} />
      <ArtistClaimLanding artistCount={artistCount} />
    </ArtistDirectoryShell>
  )
}
