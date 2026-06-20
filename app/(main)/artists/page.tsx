import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function ArtistsPage() {
  return (
    <ContentPageShell
      path="/artists"
      eyebrow="Creators"
      title="Hiffi Artists"
      description="Hiffi Artists is the home for independent rappers, producers, DJs, and beatmakers who want to share official music videos and build real fan relationships — without algorithmic gatekeeping."
      sections={[
        {
          title: "Built for independent hip-hop",
          children: (
            <>
              <p>
                Whether you are underground, emerging, or established, Hiffi gives you a platform where hip-hop is
                the default — not a category buried in a general feed. Upload music videos, freestyles, cyphers,
                beat showcases, and exclusive releases to an audience that is already looking for your sound.
              </p>
              <p>
                From drill and trap to boom bap and conscious rap, Hiffi supports the full spectrum of hip-hop
                subgenres.
              </p>
            </>
          ),
        },
        {
          title: "What artists get on Hiffi",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Direct publishing</strong> — Upload and manage music videos from Hiffi Studio and the mobile
                app.
              </li>
              <li>
                <strong>Genre-native discovery</strong> — Reach fans browsing the{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop hub
                </Link>{" "}
                and home feed.
              </li>
              <li>
                <strong>Community engagement</strong> — Connect with listeners through comments, follows, and
                creator-led interactions.
              </li>
              <li>
                <strong>Monetization tools</strong> — Support from fans through tips, subscriptions, and paid access
                as available on the platform.
              </li>
              <li>
                <strong>Creative control</strong> — You own your content and decide how it is presented.
              </li>
            </ul>
          ),
        },
        {
          title: "Who can join",
          children: (
            <p>
              Rappers, producers, DJs, beatmakers, and hip-hop content creators who meet Hiffi&apos;s creator
              guidelines can apply. We review applications to maintain quality and keep the platform focused on
              authentic music culture.
            </p>
          ),
        },
        {
          title: "How to become a Hiffi Artist",
          children: (
            <ol className="list-decimal space-y-2 pl-6">
              <li>
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Create a Hiffi account
                </Link>
                .
              </li>
              <li>
                <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                  Submit a creator application
                </Link>{" "}
                with your profile and sample work.
              </li>
              <li>Once approved, upload your first music video and start building your audience.</li>
            </ol>
          ),
        },
      ]}
      cta={{ label: "Apply as a creator", href: "/creator/apply" }}
      secondaryCta={{ label: "Explore hip-hop on Hiffi", href: "/hip-hop" }}
      relatedLinks={[
        { label: "Apply as a creator", href: "/creator/apply" },
        { label: "About Hiffi", href: "/about" },
        { label: "FAQ", href: "/faq" },
      ]}
    />
  )
}
