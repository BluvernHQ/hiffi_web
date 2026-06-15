import type { SeoProfile } from "@/lib/seo/fetch-public"
import {
  buildProfilePageDescription,
  buildProfilePageTitle,
  type ProfileVideoSummary,
} from "@/lib/seo/profile-meta"
import { absoluteUrl } from "@/lib/seo/site"

type Props = {
  username: string
  profile: SeoProfile | null
  videos?: ProfileVideoSummary[]
}

/**
 * Crawler-visible text in the initial HTML without duplicating the profile UI.
 */
export function ProfileStaticBody({ username, profile, videos = [] }: Props) {
  const title = buildProfilePageTitle(username, profile)
  const description = buildProfilePageDescription(username, profile)

  return (
    <div className="sr-only" aria-hidden="true">
      <p>{title}</p>
      <p>{description}</p>
      {videos.length > 0 ? (
        <ul>
          {videos.map((video) => (
            <li key={video.videoId}>
              <a href={absoluteUrl(`/watch/${encodeURIComponent(video.videoId)}`)}>{video.title}</a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
