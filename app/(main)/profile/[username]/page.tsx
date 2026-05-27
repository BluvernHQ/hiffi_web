import { fetchUserProfileInitial, fetchUserVideosInitial } from "@/lib/seo/fetch-public"
import { isCreator } from "@/lib/utils"
import ProfilePage from "./profile-client"

type PageProps = {
  params: Promise<{ username: string }> | { username: string }
}

export default async function ProfileRoutePage({ params }: PageProps) {
  const { username: raw } = await Promise.resolve(params)
  const username = raw.trim()

  const initialProfileUser = await fetchUserProfileInitial(username)
  const initialVideos = isCreator(initialProfileUser)
    ? await fetchUserVideosInitial(username, 10)
    : []

  return (
    <ProfilePage
      initialProfileUser={initialProfileUser}
      initialVideos={initialVideos}
    />
  )
}
