import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function CreatorsForChangePage() {
  return (
    <ContentPageShell
      path="/creators-for-change"
      eyebrow="Commitments"
      title="Creators for Change"
      description="Hiffi Creators for Change supports independent hip-hop artists and community leaders who use music to mentor, educate, and create positive cultural impact."
      sections={[
        {
          title: "What is Creators for Change?",
          children: (
            <>
              <p>
                Hip-hop has always been more than music. It is a platform for storytelling, education, activism, mentorship, and community. Hiffi's Creators for Change program recognizes artists whose work creates a positive impact both online and offline.
              </p>
              <p>
                We amplify these creators through featured placement, program partnerships, and platform resources
                — without asking them to compromise their authenticity for algorithms.
              </p>
            </>
          ),
        },
        {
          title: "How creators participate",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Apply as a Hiffi creator</strong> and publish content that reflects your community work,
                workshops, fundraisers, or educational series.
              </li>
              <li>
                <strong>Nominate a creator</strong> whose work deserves broader recognition — email us with their
                Hiffi profile and a short description of their impact.
              </li>
              <li>
                <strong>Partner with us</strong> on initiatives that connect brands, nonprofits, and artists around
                shared goals in hip-hop culture.
              </li>
            </ul>
          ),
        },
        {
          title: "What we look for",
          children: (
            <>
              <p>Creators for Change is not a popularity contest. We prioritize:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Authentic community engagement over follower counts</li>
                <li>Consistent, original content that educates or empowers</li>
                <li>Respect for artists, fans, and platform safety guidelines</li>
                <li>Work that aligns with Hiffi&apos;s artist-first mission</li>
              </ul>
            </>
          ),
        },
        {
          title: "Platform standards",
          children: (
            <p>
              All participants must follow Hiffi&apos;s{" "}
              <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and community guidelines. Hiffi reserves the right to feature or remove creators from program
              spotlights at its discretion. Program availability may vary by region.
            </p>
          ),
        },
        {
          title: "Nominate or apply",
          children: (
            <p>
              Ready to join or know someone making a difference? Reach out with your Hiffi username, links to
              relevant videos, and a brief note about the impact you&apos;re creating. Approved{" "}
              <Link href="/artists" className="font-medium text-primary hover:underline">
                Hiffi Artists
              </Link>{" "}
              are eligible for creator tools and expanded reach on the platform.
            </p>
          ),
        },
      ]}
      cta={{ label: "Apply as a creator", href: "/creator/apply" }}
      secondaryCta={{
        label: "Nominate a creator",
        href: "mailto:care@hiffi.com?subject=Creators%20for%20Change%20Nomination",
      }}
      relatedLinks={[
        { label: "Hiffi Artists", href: "/artists" },
        { label: "About Hiffi", href: "/about" },
        { label: "Advertising", href: "/advertising" },
      ]}
    />
  )
}
