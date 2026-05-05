import type { Metadata } from "next"

type RouteParams = { username: string }

async function resolvedParams(params: Promise<RouteParams> | RouteParams): Promise<RouteParams> {
  return Promise.resolve(params)
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams> | RouteParams
}): Promise<Metadata> {
  const { username: rawUsername } = await resolvedParams(params)
  const username = String(rawUsername || "").trim()
  return {
    title: username ? `@${username} Referral | Hiffi` : "Referral | Hiffi",
    description: "Join Hiffi through a creator referral link and start discovering independent artists.",
    robots: { index: false, follow: false },
  }
}

export default function ReferralLayout({ children }: { children: React.ReactNode }) {
  return children
}
