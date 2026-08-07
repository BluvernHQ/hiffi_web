import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function HowItWorksPage() {
  return (
    <ContentPageShell
      path="/how-it-works"
      eyebrow="Product"
      title="How Hiffi Works"
      description="Learn how Hiffi works for fans and independent artists — create an account, discover hip-hop music videos, upload your music, and grow your audience."
      sections={[
        {
          title: "For fans",
          children: (
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                <strong>Sign up free</strong> — Create an account at{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  hiffi.com/signup
                </Link>{" "}
                or download the{" "}
                <Link href="/app" className="font-medium text-primary hover:underline">
                  mobile app
                </Link>
                .
              </li>
              <li>
                <strong>Discover</strong> — Browse the home feed, explore the{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop hub
                </Link>
                , or use{" "}
                <Link href="/search" className="font-medium text-primary hover:underline">
                  Search
                </Link>{" "}
                to find artists and videos.
              </li>
              <li>
                <strong>Engage</strong> — Follow creators, like videos, comment, save favorites, and build playlists.
              </li>
              <li>
                <strong>Stay connected</strong> — Use Following to see new uploads from artists you care about.
              </li>
            </ol>
          ),
        },
        {
          title: "For creators",
          children: (
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                <strong>Create an account</strong> — Sign up, then{" "}
                <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                  become a creator
                </Link>
                . Hip-hop and rap artists get instant access — no application wait.
              </li>
              <li>
                <strong>Upload</strong> — Publish official music videos, freestyles, live performances, and new releases with titles, descriptions, and thumbnails.
              </li>
              <li>
                <strong>Get discovered</strong> — Reach hip-hop fans through genre pages, mood mixes, artist profiles, and search.
              </li>
              <li>
                <strong>Build your audience</strong> — Grow through follows, comments, and repeat viewers — not paid
                placement alone.
              </li>
            </ol>
          ),
        },
        {
          title: "Where to watch and upload",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Web</strong> — Stream hip-hop music videos and discover independent artists on hiffi.com.
              </li>
              <li>
                <strong>iOS &amp; Android</strong> — Watch music videos and stay connected with your favorite artists on iOS and Android.
              </li>
              <li>
                <strong>Studio</strong> — Upload, edit, and manage music videos, artwork, and creator information from{" "}
                <Link href="/studio" className="font-medium text-primary hover:underline">
                  Hiffi Studio
                </Link>
                .
              </li>
            </ul>
          ),
        },
        {
          title: "Learn More",
          children: (
            <p>
              Creators should read the{" "}
              <Link href="/creator-playbook" className="font-medium text-primary hover:underline">
                Creator Playbook
              </Link>
              . For account help, visit{" "}
              <Link href="/faq" className="font-medium text-primary hover:underline">
                FAQ
              </Link>{" "}
              or{" "}
              <Link href="/support" className="font-medium text-primary hover:underline">
                Support
              </Link>
              .
            </p>
          ),
        },
      ]}
      cta={{ label: "Join Hiffi", href: "/signup" }}
      secondaryCta={{ label: "Become a creator", href: "/creator/apply" }}
      relatedLinks={[
        { label: "What is Hiffi?", href: "/what-is-hiffi" },
        { label: "Creator Playbook", href: "/creator-playbook" },
        { label: "Hiffi Artists", href: "/artists" },
      ]}
    />
  )
}
