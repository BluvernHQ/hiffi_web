import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function HowItWorksPage() {
  return (
    <ContentPageShell
      path="/how-it-works"
      eyebrow="Product"
      title="How Hiffi works"
      description="Whether you're discovering new rap or sharing your own music videos, Hiffi is built to be straightforward — sign up, explore hip-hop culture, and connect without gatekeepers."
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
                <strong>Upload</strong> — Publish music videos, freestyles, and official releases from Hiffi Studio or
                the app. Add titles, descriptions, and thumbnails.
              </li>
              <li>
                <strong>Get discovered</strong> — Your content appears in genre-native discovery surfaces where fans
                already came for hip-hop.
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
                <strong>Web</strong> — Full experience at hiffi.com on desktop and mobile browsers.
              </li>
              <li>
                <strong>iOS &amp; Android</strong> — Native apps for watching on the go and creator uploads where
                supported.
              </li>
              <li>
                <strong>Studio</strong> — Creators can manage uploads from{" "}
                <Link href="/studio" className="font-medium text-primary hover:underline">
                  Hiffi Studio
                </Link>
                .
              </li>
            </ul>
          ),
        },
        {
          title: "Need more detail?",
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
