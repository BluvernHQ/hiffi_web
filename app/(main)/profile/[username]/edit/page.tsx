import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getArtistBySlug } from "@/lib/artists"
import { fetchUserProfileInitial } from "@/lib/seo/fetch-public"
import EditProfileClient from "./edit-client"

type PageProps = {
  params: Promise<{ username: string }> | { username: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username: raw } = await Promise.resolve(params)
  const username = raw.trim()
  return {
    title: `Edit @${username}`,
    robots: { index: false, follow: false },
  }
}

export default async function EditProfilePage({ params }: PageProps) {
  const { username: raw } = await Promise.resolve(params)
  const username = raw.trim()
  if (!username) notFound()

  const initialProfileUser = await fetchUserProfileInitial(username)
  if (!initialProfileUser) notFound()

  const inInventory =
    (initialProfileUser as { in_inventory?: unknown }).in_inventory === true
  const initialArtist = inInventory ? ((await getArtistBySlug(username)) ?? null) : null

  return (
    <EditProfileClient
      initialProfileUser={initialProfileUser}
      initialArtist={initialArtist}
    />
  )
}
