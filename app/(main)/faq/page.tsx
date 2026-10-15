import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

const pageTitle = "FAQ"
const pageDescription =
  "Frequently asked questions about Hiffi — the hip-hop-first streaming platform for independent rap artists and fans. Account setup, discovery, playback, creator tools, and support."
const pageUrl = absoluteUrl("/faq")

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "Hiffi FAQ",
    "hip hop streaming platform FAQ",
    "rap music video platform",
    "best platform for independent hip hop artists",
    "upload rap music video",
    "how to use Hiffi",
    "Hiffi frequently asked questions",
    "how to create a Hiffi account",
    "how to upload music on Hiffi",
    "Hiffi creator help",
    "Hiffi account support",
    "Hiffi help center",
    "common Hiffi questions",
    "underground rap streaming",
    "drill music app",
    "Hiffi support",
    "creator video platform",
    "hip hop app",
    "video platform FAQ",
    "global hip hop platform",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: `${pageTitle} | Hiffi`,
    description: pageDescription,
    url: pageUrl,
    type: "website",
    siteName: "Hiffi",
    locale: "en_US",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} | Hiffi`,
    description: pageDescription,
    images: [absoluteUrl("/hiffi_logo.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

type FaqItem = {
  question: string
  answer: string
  category:
    | "Getting Started"
    | "App & downloads"
    | "Watching & Discovery"
    | "Creators"
    | "Account & Support"
  /** When set, this exact substring of `answer` is rendered as a link */
  answerLink?: { href: string; match: string }
}

const faqItems: FaqItem[] = [
  {
    question: "What is Hiffi?",
    answer:
      "Hiffi is a hip-hop-first music and video streaming platform built for independent rap artists and fans. Hip-hop accounts for roughly 25% of global music streams (IFPI Global Music Report), yet most major platforms are built for every genre at once. Hiffi is purpose-built for hip-hop — artists publish music videos and connect directly with audiences, no algorithmic gatekeeping, no label required.",
    category: "Getting Started",
    answerLink: { href: "/hip-hop", match: "hip-hop" },
  },
  {
    question: "Where is Hiffi available?",
    answer:
      "Hiffi is available globally. Artists and listeners from the United States, India, and many other regions can access the platform, subject to local internet regulations.",
    category: "Getting Started",
  },
  {
    question: "How do I create a Hiffi account?",
    answer:
      "Select Sign Up, add your basic details, verify your email if prompted, and complete your profile to start using the platform.",
    category: "Getting Started",
  },
  {
    question: "Can I reset my password if I forget it?",
    answer:
      "Yes. Use the Forgot Password page, verify your email with the OTP flow, and set a new password.",
    category: "Getting Started",
  },
  {
    question: "How do I get Hiffi?",
    answer:
      "Install Hiffi on your phone or tablet from our official download page: Download Hiffi App. That page lists the App Store and Google Play links (and QR codes on desktop).",
    category: "Getting Started",
    answerLink: { href: "/app", match: "Download Hiffi App" },
  },
  {
    question: "Is Hiffi available on iPhone?",
    answer:
      "Yes. Download Hiffi from the App Store on iPhone and iPad in supported regions. Official store links are on the Download Hiffi App page.",
    category: "App & downloads",
  },
  {
    question: "Is Hiffi available on Android?",
    answer:
      "Yes. Download Hiffi from Google Play on supported Android devices. Official store links are on the Download Hiffi App page.",
    category: "App & downloads",
  },
  {
    question: "Is Hiffi free to download?",
    answer:
      "Yes. The Hiffi app is free to download on iOS and Android. In-app experiences may vary based on your account and how you use the platform.",
    category: "App & downloads",
  },
  {
    question: "Can artists upload videos on Hiffi?",
    answer:
      "Yes. Creators can upload and manage videos from the Hiffi app and web experience, subject to platform rules and your account status.",
    category: "App & downloads",
  },
  {
    question: "Is Hiffi for hip-hop and rap artists?",
    answer:
      "Absolutely. Hiffi is built specifically for the hip-hop and rap community — both artists and fans. Independent rappers, drill artists, conscious rap creators, and boom bap producers are all welcome. Upload your music videos, grow your audience, and get discovered without paying for placement.",
    category: "App & downloads",
    answerLink: { href: "/creator/apply", match: "Upload your music videos" },
  },
  {
    question: "What hip-hop subgenres are on Hiffi?",
    answer:
      "Hiffi supports the full spectrum of hip-hop: drill, trap, conscious rap, boom bap, lo-fi hip-hop, melodic rap, rage rap, and more. Explore our hip-hop hub to browse by mood and vibe — from hard-hitting drill bangers to late-night introspective rap.",
    category: "App & downloads",
    answerLink: { href: "/hip-hop", match: "hip-hop hub" },
  },
  {
    question: "How is Hiffi different from YouTube for rap artists?",
    answer:
      "Hiffi is purpose-built for hip-hop and rap creators, not a general video platform. Studies show that niche-specific platforms generate 3–5x higher engagement per view than general platforms for genre content. On Hiffi, your content reaches an audience that came specifically for hip-hop — no competition with unrelated content, no algorithmic suppression, and creator-first tools that put artists in control.",
    category: "App & downloads",
  },
  {
    question: "Can underground rappers upload to Hiffi?",
    answer:
      "Yes. Hiffi is designed for independent and underground rap artists. Apply through the Become a Creator flow, upload your official music videos, and build your fanbase directly — no label, no gatekeeping.",
    category: "App & downloads",
    answerLink: { href: "/creator/apply", match: "Become a Creator flow" },
  },
  {
    question: "How do I find videos on Hiffi?",
    answer:
      "You can browse the home feed and use Search to find videos and creators. Open a result to go directly to the watch page or creator profile.",
    category: "Watching & Discovery",
  },
  {
    question: "What can I do on a video watch page?",
    answer:
      "You can watch the video, open related content, like or dislike, comment, reply to comments, follow the creator, and add videos to playlists.",
    category: "Watching & Discovery",
  },
  {
    question: "Can I like videos and view them later?",
    answer:
      "Yes. Liked videos are available in the Liked section for signed-in users.",
    category: "Watching & Discovery",
  },
  {
    question: "Can I follow creators?",
    answer:
      "Yes. You can follow or unfollow creators from profile and watch pages, and see followed creators' content in the Following feed.",
    category: "Watching & Discovery",
  },
  {
    question: "How do playlists work?",
    answer:
      "You can create playlists, edit names and descriptions, add or remove videos, and play videos directly from playlist views.",
    category: "Watching & Discovery",
  },
  {
    question: "Does Hiffi keep watch history?",
    answer:
      "Yes. Signed-in users can view watch history in the History section.",
    category: "Watching & Discovery",
  },
  {
    question: "What can creators do on Hiffi?",
    answer:
      "Creators can set up their profile, upload and manage video content, and build an audience through discoverability and engagement features available on the platform.",
    category: "Creators",
  },
  {
    question: "How do I become a creator on Hiffi?",
    answer:
      "Use the Become a Creator flow from your account. Hip-hop and rap artists unlock creator tools instantly — upload from Studio or the app right away.",
    category: "Creators",
  },
  {
    question: "How do creators upload videos?",
    answer:
      "Creators can use the Upload page to submit videos with metadata and thumbnails. Upload progress is managed in-app and videos are available after processing completes.",
    category: "Creators",
  },
  {
    question: "Why does my uploaded video show Processing?",
    answer:
      "After upload, videos go through processing before they become playable. While processing is in progress, the video card shows a Processing label and playback is blocked until processing is complete.",
    category: "Creators",
  },
  {
    question: "Can I edit my profile and profile picture?",
    answer:
      "Yes. You can update profile details and profile picture from your own profile settings.",
    category: "Account & Support",
  },
  {
    question: "Does Hiffi support high-quality video playback?",
    answer:
      "Yes. Hiffi is built for high-quality video and audio experiences. Playback quality depends on your device, internet speed, and creator upload settings.",
    category: "Watching & Discovery",
  },
  {
    question: "How do I report an account or content issue?",
    answer:
      "While signed in, use Report on a video, comment, or profile. Track your cases on My reports. You can also email care@hiffi.com with your case reference, profile links, video links, and screenshots.",
    category: "Account & Support",
    answerLink: { href: "/support/reports", match: "My reports" },
  },
  {
    question: "How does Hiffi handle privacy and data security?",
    answer:
      "Hiffi follows documented data practices and security controls described in the Privacy Policy. We process personal information for account operations, safety, and platform improvement.",
    category: "Account & Support",
  },
  {
    question: "Who should I contact for support?",
    answer:
      "For account, playback, profile, or technical issues, contact care@hiffi.com. The support team reviews requests and responds based on issue priority and volume.",
    category: "Account & Support",
  },
]

const faqCategoryOrder: FaqItem["category"][] = [
  "Getting Started",
  "App & downloads",
  "Watching & Discovery",
  "Creators",
  "Account & Support",
]

const categoryIdMap: Record<FaqItem["category"], string> = {
  "Getting Started": "getting-started",
  "App & downloads": "app-and-downloads",
  "Watching & Discovery": "watching-and-discovery",
  Creators: "creators",
  "Account & Support": "account-and-support",
}

function FaqAnswer({ item }: { item: FaqItem }) {
  const link = item.answerLink
  if (!link) {
    return <p className="leading-relaxed text-foreground/90 mt-3">{item.answer}</p>
  }
  const idx = item.answer.indexOf(link.match)
  if (idx === -1) {
    return <p className="leading-relaxed text-foreground/90 mt-3">{item.answer}</p>
  }
  const before = item.answer.slice(0, idx)
  const after = item.answer.slice(idx + link.match.length)
  return (
    <p className="leading-relaxed text-foreground/90 mt-3">
      {before}
      <Link href={link.href} className="font-medium text-primary hover:underline">
        {link.match}
      </Link>
      {after}
    </p>
  )
}

// WebPage + FAQPage only — Organization uses the single node in root layout (same @id) for GEO consistency.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: pageTitle,
      description: pageDescription,
      inLanguage: "en",
      isPartOf: { "@id": `${getSiteOrigin()}/#website` },
      about: { "@id": `${getSiteOrigin()}/#organization` },
      mainEntity: { "@id": `${pageUrl}#faq` },
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: pageUrl,
      about: { "@id": `${getSiteOrigin()}/#organization` },
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ],
}

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <JsonLd data={faqJsonLd} />

      <h1 className="text-3xl font-bold mb-4 text-foreground">Frequently Asked Questions</h1>
      <p className="text-muted-foreground mb-8 leading-relaxed">
        Find quick answers about Hiffi accounts, creator profiles, video playback, and platform support
        across regions including the United States, India, and global audiences.
      </p>

      <section className="mb-8 rounded-xl border border-border bg-muted/20 p-4 sm:p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Quick links</h2>
        <div className="mb-3">
          <Link
            href="/app"
            className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Download Hiffi App
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {faqCategoryOrder.map((category) => (
            <a
              key={category}
              href={`#${categoryIdMap[category]}`}
              className="rounded-full border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              {category}
            </a>
          ))}
        </div>
      </section>

      <div className="space-y-8 text-foreground/90">
        {faqCategoryOrder.map((category) => {
          const items = faqItems.filter((item) => item.category === category)
          return (
            <section key={category} id={categoryIdMap[category]} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-foreground mb-3">{category}</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <details key={item.question} className="group rounded-xl border border-border bg-muted/20 p-4">
                    <summary className="cursor-pointer list-none text-base font-medium text-foreground pr-6 relative">
                      {item.question}
                      <span className="absolute right-0 top-0 text-muted-foreground group-open:rotate-45 transition-transform">
                        +
                      </span>
                    </summary>
                    <FaqAnswer item={item} />
                  </details>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-muted/30 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Need more help?</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Reach out at{" "}
          <a href="mailto:care@hiffi.com" className="text-primary hover:underline font-medium">
            care@hiffi.com
          </a>{" "}
          or visit the <Link href="/support" className="text-primary hover:underline font-medium">Support page</Link>.
        </p>
      </section>
    </div>
  )
}
