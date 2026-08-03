import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function ArtistsPage() {
  return (
    <ContentPageShell
      path="/artists"
      eyebrow="Creators"
      title="Hiffi Artists"
      description="Hiffi Artists is the home for independent hip-hop artists, independent rappers, producers, DJs, and beatmakers. Create your artist profile, upload official music videos, reach new fans, and grow your audience on Hiffi's artist-first hip-hop streaming platform."
      sections={[
        {
          title: "Why Artists Choose Hiffi",
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
                <strong>Artist profile</strong> — Create a verified artist profile with your music videos, releases, biography, and social links.
              </li>
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
                <strong>Creative control</strong> — You own your content and decide how it is presented.
              </li>
            </ul>
          ),
        },{
  title: "Discover Independent Hip-Hop Artists",
  children: (
    <>
      <p>
        Hiffi helps fans discover independent hip-hop artists through{" "}
        <Link href="/artist-index" className="font-medium text-primary hover:underline">
          the Hiffi Artist Directory
        </Link>
        , artist profiles, genre pages, and curated mood mixes.
      </p>

      <p className="mt-3">
        Browse emerging rappers, producers, DJs, and beatmakers, watch official
        music videos, and follow new artists as they grow. Whether you're
        looking for your next favorite rapper or exploring underground hip-hop,
        Hiffi makes discovering new talent simple.
      </p>

      <ul className="mt-4 list-disc space-y-2 pl-6">
        <li>
          Browse the{" "}
          <Link href="/artist-index" className="font-medium text-primary hover:underline">
            Artist Directory
          </Link>{" "}
          to discover independent hip-hop artists.
        </li>
        <li>
          Explore music by genre in the{" "}
          <Link href="/hip-hop" className="font-medium text-primary hover:underline">
            Hip-Hop Hub
          </Link>
          .
        </li>
        <li>
          Discover regional talent through the{" "}
          <Link href="/artist-index/city/atlanta" className="font-medium text-primary hover:underline">
            Atlanta Artist Directory
          </Link>
          .
        </li>
      </ul>
    </>
  ),
},
        {
          title: "Who can join",
          children: (
            <p>
              Rappers, producers, DJs, beatmakers, and hip-hop content creators can{" "}
              <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                become a creator instantly
              </Link>
              . Hiffi is built for hip-hop, rap, and related artists — no application wait.
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
                  Become a creator
                </Link>{" "}
                — instant access for hip-hop and rap artists.
              </li>
              <li>Upload your first official music video, complete your artist profile, and begin reaching new fans through Hiffi discovery.</li>
            </ol>
          ),
        },
      ]}
      cta={{ label: "Become a creator", href: "/creator/apply" }}
      secondaryCta={{ label: "Explore hip-hop on Hiffi", href: "/hip-hop" }}
      relatedLinks={[
        { label: "Become a creator", href: "/creator/apply" },
        { label: "About Hiffi", href: "/about" },
        { label: "FAQ", href: "/faq" },
      ]}
    />
  )
}
