import type { Metadata } from "next"
import Link from "next/link"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getSiteOrigin } from "@/lib/seo/site"

const pageTitle = "Hiffi FAQ - Accounts, Video Features, and Support"
const pageDescription =
  "Frequently asked questions about Hiffi for viewers and creators, including account setup, discovery, playback, profiles, creator tools, and support."
const pageUrl = absoluteUrl("/faq")

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  keywords: [
    "Hiffi FAQ",
    "Hiffi support",
    "creator video platform",
    "creator profiles",
    "high quality video platform",
    "video platform FAQ",
    "video search",
    "playlists",
    "comments and replies",
    "follow creators",
    "global creator platform",
    "USA creator platform",
    "India creator platform",
  ],
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: pageUrl,
    type: "article",
    siteName: "Hiffi",
    locale: "en_US",
    images: [{ url: absoluteUrl("/hiffi_logo.png"), alt: "Hiffi logo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: pageDescription,
    images: [absoluteUrl("/hiffi_logo.png")],
  },
  robots: {
    index: true,
    follow: true,
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
      "Hiffi is a creator-first platform where independent artists can publish video content and connect with audiences through discovery and engagement features.",
    category: "Getting Started",
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
      "Hiffi is built with hip-hop and rap culture in mind and welcomes independent artists and fans across related genres. You can discover music videos, follow creators, and stream high-quality audio in the app.",
    category: "App & downloads",
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
      "Use the Become a Creator flow to apply from your account. Once approved in-app, creator tools such as upload are available.",
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
      "Contact support with relevant details at care@hiffi.com. Include profile links, video links, and screenshots to help faster review.",
    category: "Account & Support",
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
    },
    {
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      url: pageUrl,
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
    {
      "@type": "Organization",
      "@id": `${getSiteOrigin()}/#organization`,
      name: "Hiffi",
      url: getSiteOrigin(),
      areaServed: ["US", "IN", "Worldwide"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "care@hiffi.com",
        availableLanguage: ["English"],
      },
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
