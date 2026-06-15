import { notFound } from "next/navigation"
import { ProfileNoscriptSeo } from "@/components/profile/profile-noscript-seo"
import { ProfileStaticBody } from "@/components/profile/profile-static-body"
import {
  checkUserPublic,
  fetchUserForSeo,
  fetchUserProfileInitial,
  fetchUserVideosInitial,
} from "@/lib/seo/fetch-public"
import { buildProfileVideoSummaries } from "@/lib/seo/profile-meta"
import { isCreator } from "@/lib/utils"
import ProfilePage from "./profile-client"

type PageProps = {
  params: Promise<{ username: string }> | { username: string }
}

export default async function ProfileRoutePage({ params }: PageProps) {
  const { username: raw } = await Promise.resolve(params)
  const username = raw.trim()

  const [initialProfileUser, seoProfile, userStatus] = await Promise.all([
    fetchUserProfileInitial(username),
    fetchUserForSeo(username),
    checkUserPublic(username),
  ])

  if (!initialProfileUser && userStatus === "not_found") {
    notFound()
  }
  const initialVideos = isCreator(initialProfileUser)
    ? await fetchUserVideosInitial(username, 10)
    : []
  const videoSummaries = buildProfileVideoSummaries(initialVideos)

  return (
    <>
      <ProfileStaticBody username={username} profile={seoProfile} videos={videoSummaries} />
      <ProfileNoscriptSeo username={username} profile={seoProfile} videos={videoSummaries} />
      <ProfilePage initialProfileUser={initialProfileUser} initialVideos={initialVideos} />
    </>
  )
}
