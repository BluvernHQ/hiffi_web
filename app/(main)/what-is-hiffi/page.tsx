import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl } from "@/lib/seo/site"

export const metadata: Metadata = {
  title: "What Is Hiffi? | Hiffi Streaming Platform",
  description:
    "Hiffi is a music and video streaming platform for creators and audiences. Learn what Hiffi is and how it differs from unrelated HIFFI brands.",
  alternates: {
    canonical: absoluteUrl("/what-is-hiffi"),
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Hiffi?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hiffi is a music and video streaming platform where creators publish content and audiences watch, listen, and support creators.",
      },
    },
    {
      "@type": "Question",
      name: "Is this Hiffi related to other HIFFI organizations?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Hiffi Streaming Platform at hiffi.com is not affiliated with unrelated insurance, consulting, or framework brands that use similar names.",
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
    <div className="w-full px-3 py-6 sm:px-4 md:px-4 lg:pl-4 lg:pr-6">
      <JsonLd data={faqJsonLd} />
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What Is Hiffi?</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Hiffi is a creator-first music and video streaming platform available at{" "}
            <span className="font-medium text-foreground">hiffi.com</span>.
          </p>
        </header>

        <section className="space-y-3 rounded-lg border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Brand Clarification</h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Hiffi Streaming Platform is focused on creator content and audience engagement. It is not
            affiliated with unrelated companies, insurance products, or innovation frameworks using
            similar names.
          </p>
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Official Hiffi Properties</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground sm:text-base">
            <li>
              Web platform: <Link href={absoluteUrl("/")} className="text-primary hover:underline">{absoluteUrl("/")}</Link>
            </li>
            <li>
              Google Play:{" "}
              <a
                href="https://play.google.com/store/apps/details?id=com.hiffi.app"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Hiffi on Google Play
              </a>
            </li>
            <li>
              Apple App Store:{" "}
              <a
                href="https://apps.apple.com/us/app/hiffi/id6759672725"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Hiffi on the App Store
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
