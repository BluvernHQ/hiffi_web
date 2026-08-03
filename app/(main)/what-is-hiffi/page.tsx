import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"
import { JsonLd } from "@/components/seo/json-ld"

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Hiffi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hiffi is a music and video streaming platform where hip-hop creators publish official music videos and audiences watch, listen, follow artists, and support creators.",
      },
    },
  
    {
      "@type": "Question",
      name: "Where can I access Hiffi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can use Hiffi on the web at hiffi.com and through the official mobile apps on Google Play and the Apple App Store.",
      },
    },
  ],
}

export default function WhatIsHiffiPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <ContentPageShell
        path="/what-is-hiffi"
        eyebrow="Overview"
        title="What is Hiffi?"
        description="Hiffi is an independent hip-hop streaming platform where artists publish music videos, discover new fans, and grow their audience without algorithmic gatekeeping."
        sections={[
          {
            title: "The platform",
            children: (
              <p>
                Hiffi is a music and video streaming service focused on hip-hop and rap. Creators upload official music
                videos, freestyles, and culture-driven content. Fans browse, watch, follow artists, build playlists, and
                engage with the community — on web and mobile.
              </p>
            ),
          },
          {
            title: "Who Hiffi Is Built For",
            children: (
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Artists</strong> — Rappers, producers, DJs, and beatmakers looking to share music, grow their audience, and connect with hip-hop fans. 
                  <br></br>See{" "}
                  <Link href="/artists" className="font-medium text-primary hover:underline">
                    Hiffi Artists
                  </Link>
                  .
                </li>
                <li>
                  <strong>Fans</strong> — Discover underground rap, drill, trap, boom bap, and emerging independent artists in one place. Explore the{" "}
                  <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                    hip-hop hub
                  </Link>
                  .
                </li>
              </ul>
            ),
          },
        
          {
            title: "How to get started",
            children: (
              <ol className="list-decimal space-y-2 pl-6">
                <li>
                  <Link href="/signup" className="font-medium text-primary hover:underline">
                    Create a free account
                  </Link>
                  .
                </li>
                <li>
                  Watch music videos and discover new artists on the web, or{" "}
                  <Link href="/app" className="font-medium text-primary hover:underline">
                    download the Hiffi app
                  </Link>
                  .
                </li>
                <li>
                  Artists can{" "}
                  <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                    apply as creator
                  </Link>{" "}
                  to publish music videos and reach hip-hop fans.
                </li>
              </ol>
            ),
          },
        ]}
        cta={{ label: "Join Hiffi", href: "/signup" }}
        secondaryCta={{ label: "Learn how it works", href: "/how-it-works" }}
        relatedLinks={[
          { label: "About Hiffi", href: "/about" },
          { label: "How it works", href: "/how-it-works" },
          { label: "FAQ", href: "/faq" },
        ]}
      />
    </>
  )
}
