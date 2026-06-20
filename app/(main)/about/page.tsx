import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function AboutPage() {
  return (
    <ContentPageShell
      path="/about"
      eyebrow="About us"
      title="Artist-first platform for hip-hop"
      description="Hiffi puts creators, culture, and community at the center. We built a streaming home where independent rap artists can share music videos, connect with real fans, and grow without gatekeepers."
      sections={[
        {
          title: "Why Hiffi exists",
          children: (
            <>
              <p>
                Most platforms treat hip-hop as one genre among thousands. Artists compete with unrelated content,
                discovery favors whoever games the algorithm, and independent creators get buried. Hiffi was created
                with a simple belief: artists deserve a platform that puts creativity and community first.
              </p>
              <p>
                We champion hip-hop by showcasing talent based on artistry — from underground rap and drill to boom bap
                and conscious rap — not popularity metrics alone.
              </p>
            </>
          ),
        },
        {
          title: "For creators",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Share your music</strong> — Upload rap music, music videos, freestyles, cyphers, and exclusive
                releases.
              </li>
              <li>
                <strong>Engage your community</strong> — Connect with fans through comments, follows, and creator-led
                interactions.
              </li>
              <li>
                <strong>Reach real fans</strong> — Get discovered by listeners browsing the{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop hub
                </Link>{" "}
                and home feed.
              </li>
              <li>
                <strong>Keep control</strong> — You own your content and decide how it is presented.
              </li>
            </ul>
          ),
        },
        {
          title: "For fans",
          children: (
            <p>
              Hiffi is free for fans. Discover underground sounds, emerging artists, and new releases on your terms.
              Explore freestyles, live performances, and culture-first content from local and global communities —
              discovery that feels human, not algorithmic.
            </p>
          ),
        },
        {
          title: "Our vision",
          children: (
            <p>
              Hiffi aims to become the home artists and fans have been waiting for. More than a streaming service,
              we&apos;re building a community where creators can grow, listeners can discover new music, and hip-hop
              culture can thrive without gatekeepers.
            </p>
          ),
        },
        {
          title: "Who we are",
          children: (
            <p>
              Hiffi is operated by Kinimi Corporation. We&apos;re a team focused on building tools that serve
              independent music culture — with transparent policies, responsive support, and a long-term commitment
              to artist-first values. Questions? Reach us at{" "}
              <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                care@hiffi.com
              </a>
              .
            </p>
          ),
        },
        {
          title: "Learn more",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <Link href="/what-is-hiffi" className="font-medium text-primary hover:underline">
                  What is Hiffi?
                </Link>{" "}
                — Platform overview and disambiguation
              </li>
              <li>
                <Link href="/how-it-works" className="font-medium text-primary hover:underline">
                  How it works
                </Link>{" "}
                — For fans and creators
              </li>
              <li>
                <Link href="/artists" className="font-medium text-primary hover:underline">
                  Hiffi Artists
                </Link>{" "}
                — How creators join and publish on the platform
              </li>
              <li>
                <Link href="/creators-for-change" className="font-medium text-primary hover:underline">
                  Creators for Change
                </Link>{" "}
                — Our commitment to community impact
              </li>
              <li>
                <Link href="/faq" className="font-medium text-primary hover:underline">
                  FAQ
                </Link>{" "}
                — Accounts, playback, uploads, and support
              </li>
              <li>
                <Link href="/support" className="font-medium text-primary hover:underline">
                  Support
                </Link>{" "}
                — Get help with your account
              </li>
            </ul>
          ),
        },
      ]}
      cta={{ label: "Join Hiffi", href: "/signup" }}
      secondaryCta={{ label: "Apply as a creator", href: "/creator/apply" }}
      relatedLinks={[
        { label: "What is Hiffi?", href: "/what-is-hiffi" },
        { label: "How it works", href: "/how-it-works" },
        { label: "FAQ", href: "/faq" },
      ]}
    />
  )
}
