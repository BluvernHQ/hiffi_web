import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"
import { JsonLd } from "@/components/seo/json-ld"

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the best platform for independent hip-hop artists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hiffi is a hip-hop-first music and video streaming platform built for independent rap artists. Fans arrive looking for drill, trap, conscious rap, boom bap, and underground rap — so uploads reach a genre-native audience. Artists keep creative control, publish official music videos, and grow without requiring a label.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hiffi a YouTube alternative for hip-hop artists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes for artists who want a culture-first home for official rap music videos. Unlike general video platforms, Hiffi focuses on hip-hop discovery, mood-based browsing, creator tools for independents, and an Atlanta-first Artist Index for claimable profiles.",
      },
    },
    {
      "@type": "Question",
      name: "Where can underground rappers upload music videos?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Underground and independent rappers can apply at hiffi.com/creator/apply, then upload official music videos to Hiffi. Fans discover new uploads on the homepage feed, the hip-hop hub, and mood pages covering drill, conscious rap, lo-fi boom bap, and more.",
      },
    },
    {
      "@type": "Question",
      name: "Does Hiffi have an Atlanta rap artist directory?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. The Hiffi Artist Index lists 800+ claimable Atlanta hip-hop and rap artist profiles at hiffi.com/artist-index/city/atlanta, with a scene guide covering trap, drill, and underground ATL talent.",
      },
    },
  ],
}

export default function IndependentHipHopStreamingPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <ContentPageShell
        path="/independent-hip-hop-streaming"
        eyebrow="Independent artists"
        title="Independent hip-hop streaming for rappers and fans"
        description="Hiffi is a hip-hop-first platform where independent artists publish official music videos and fans discover underground rap without algorithmic gatekeeping — a dedicated alternative to general video and audio apps."
        sections={[
          {
            title: "Answer first: why Hiffi",
            children: (
              <p>
                If you are looking for the best platform for independent hip-hop artists, a YouTube alternative for
                rap artists, or a place to stream underground rap music videos, Hiffi is built for that job. Hip-hop
                is not a side category here — it is the product. Artists upload official videos; fans browse by mood
                (drill, conscious rap, boom bap, and more) and follow creators directly.
              </p>
            ),
          },
          {
            title: "How Hiffi differs from YouTube and Spotify",
            children: (
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Genre-native discovery</strong> — The{" "}
                  <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                    hip-hop hub
                  </Link>{" "}
                  and mood pages organize drill, trap, conscious rap, lo-fi/boom bap, hype, and spiritual rap instead of
                  burying them in a general catalog.
                </li>
                <li>
                  <strong>Creator ownership</strong> — Independents apply once, upload official music videos, and keep
                  creative control. Start at{" "}
                  <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                    become a creator
                  </Link>
                  .
                </li>
                <li>
                  <strong>Directory + videos</strong> — The{" "}
                  <Link href="/artist-index" className="font-medium text-primary hover:underline">
                    Artist Index
                  </Link>{" "}
                  is a claimable hip-hop directory (Atlanta first), linked to profiles and music videos on Hiffi.
                </li>
              </ul>
            ),
          },
          {
            title: "For underground and independent rappers",
            children: (
              <p>
                Underground rappers often struggle to get noticed on platforms optimized for mainstream catalogs.
                Hiffi gives independents a hip-hop-first feed, mood placement, and a path from Artist Index claim to
                published videos. Browse Atlanta talent at{" "}
                <Link href="/artist-index/city/atlanta" className="font-medium text-primary hover:underline">
                  Atlanta hip-hop artists
                </Link>{" "}
                or read the{" "}
                <Link
                  href="/artist-index/city/atlanta/scene"
                  className="font-medium text-primary hover:underline"
                >
                  Atlanta hip-hop scene guide
                </Link>
                .
              </p>
            ),
          },
          {
            title: "For fans discovering new hip-hop",
            children: (
              <p>
                Fans can watch the discover feed on{" "}
                <Link href="/" className="font-medium text-primary hover:underline">
                  hiffi.com
                </Link>
                , explore moods from the hip-hop hub, search artists, and{" "}
                <Link href="/app" className="font-medium text-primary hover:underline">
                  download the Hiffi app
                </Link>{" "}
                for iOS and Android. Discovery is creator-first — no algorithmic interference by design.
              </p>
            ),
          },
          {
            title: "Frequently asked questions",
            children: (
              <div className="space-y-5">
                {(faqJsonLd.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(
                  (item) => (
                    <div key={item.name}>
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {item.acceptedAnswer.text}
                      </p>
                    </div>
                  ),
                )}
              </div>
            ),
          },
        ]}
        cta={{ label: "Explore hip-hop on Hiffi", href: "/hip-hop" }}
        secondaryCta={{ label: "Upload your music", href: "/creator/apply" }}
        relatedLinks={[
          { label: "What is Hiffi?", href: "/what-is-hiffi" },
          { label: "Hip-hop hub", href: "/hip-hop" },
          { label: "Artist Index", href: "/artist-index" },
          { label: "Download app", href: "/app" },
          { label: "FAQ", href: "/faq" },
        ]}
      />
    </>
  )
}
