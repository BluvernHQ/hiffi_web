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

/** Plain HTML for users and tools without JavaScript. */
export function ProfileNoscriptSeo({ username, profile, videos = [] }: Props) {
  const title = buildProfilePageTitle(username, profile)
  const description = buildProfilePageDescription(username, profile)

  return (
    <noscript>
      <h1>{title}</h1>
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
    </noscript>
  )
}
