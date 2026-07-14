import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function AdvertisingPage() {
  return (
    <ContentPageShell
      path="/advertising"
      eyebrow="Business"
      title="Hiffi Advertising"
      description="Connect with fans who come to Hiffi specifically for hip-hop — independent artists, underground rap, freestyles, and culture-first discovery."
      sections={[
        {
          title: "Why advertise on Hiffi",
          children: (
            <>
              <p>
                Unlike general video platforms, Hiffi is built for hip-hop culture. Your brand reaches listeners
                and creators who are actively seeking rap music, music videos, and authentic artist stories — not
                a generic feed where music is one category among thousands.
              </p>
              <p>
                That focus means higher relevance: campaigns sit alongside content your audience already cares
                about.
              </p>
            </>
          ),
        },
        {
          title: "Partnership formats",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Sponsored drops &amp; premieres</strong> — Launch new releases, albums, or brand moments
                with featured placement and creator-led storytelling.
              </li>
              <li>
                <strong>Artist collaborations</strong> — Co-create content with Hiffi creators whose audience
                aligns with your brand values.
              </li>
              <li>
                <strong>Hub &amp; genre sponsorships</strong> — Partner around{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop discovery
                </Link>{" "}
                experiences, moods, and curated collections.
              </li>
              <li>
                <strong>Creator programs</strong> — Support emerging talent through branded initiatives tied to
                authentic music culture.
              </li>
            </ul>
          ),
        },
        {
          title: "Who we work with",
          children: (
            <p>
              We partner with labels, distributors, lifestyle brands, audio gear companies, festivals, and
              mission-aligned organizations that respect artist-first values. All campaigns are reviewed to
              ensure they fit Hiffi&apos;s community standards and creator guidelines.
            </p>
          ),
        },
        {
          title: "Brand safety & transparency",
          children: (
            <>
              <p>
                Hiffi prioritizes a safe environment for creators and fans. Advertising partnerships must comply
                with our{" "}
                <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                  Terms of Use
                </Link>{" "}
                and community guidelines. We do not sell user data for unrelated third-party marketing — see our{" "}
                <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </>
          ),
        },
        {
          title: "Get started",
          children: (
            <p>
              Tell us about your campaign goals, target audience, and timeline. Our team will follow up with
              available formats, reach estimates, and next steps. For structured partnership inquiries, you can
              also use the{" "}
              <Link href="/collaborate" className="font-medium text-primary hover:underline">
                brand collaboration form
              </Link>
              .
            </p>
          ),
        },
      ]}
      cta={{
        label: "Contact our team",
        href: "mailto:care@hiffi.com?subject=Hiffi%20Advertising%20Inquiry",
      }}
      secondaryCta={{ label: "Brand collaboration form", href: "/collaborate" }}
      relatedLinks={[
        { label: "Brand collaboration", href: "/collaborate" },
        { label: "About Hiffi", href: "/about" },
        { label: "Hiffi Artists", href: "/artists" },
      ]}
    />
  )
}
