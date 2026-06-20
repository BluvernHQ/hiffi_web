import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function CreatorPlaybookPage() {
  return (
    <ContentPageShell
      path="/creator-playbook"
      eyebrow="Creators"
      title="Creator Playbook"
      description="A practical guide for rappers, producers, and DJs — from your first application to uploading music videos and growing a real fanbase on Hiffi."
      sections={[
        {
          title: "Before you start",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>You need a Hiffi account —{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  sign up free
                </Link>
                .
              </li>
              <li>
                Have at least one sample of your work ready (music video, freestyle, or official release) for your{" "}
                <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                  creator application
                </Link>
                .
              </li>
              <li>
                Read our{" "}
                <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                  Terms of Use
                </Link>{" "}
                — you must own or have rights to everything you upload.
              </li>
            </ul>
          ),
        },
        {
          title: "Step 1 — Get approved",
          children: (
            <ol className="list-decimal space-y-2 pl-6">
              <li>Complete your profile with a clear photo and bio.</li>
              <li>Submit the creator application with accurate info and sample work.</li>
              <li>Wait for review — we focus on authentic hip-hop and rap creators.</li>
              <li>Once approved, upload tools unlock in the app and Studio.</li>
            </ol>
          ),
        },
        {
          title: "Step 2 — Upload your best work",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Quality matters</strong> — Use clear audio and video. Official music videos perform best on
                Hiffi.
              </li>
              <li>
                <strong>Strong metadata</strong> — Write descriptive titles. Mention subgenre (drill, trap, boom bap,
                etc.) where it fits naturally.
              </li>
              <li>
                <strong>Thumbnails</strong> — Use a compelling cover image that reads well on mobile.
              </li>
              <li>
                <strong>Processing</strong> — Videos may show “Processing” briefly after upload; playback unlocks when
                ready.
              </li>
            </ul>
          ),
        },
        {
          title: "Step 3 — Grow your audience",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>Share your Hiffi watch links on social — drive fans to your profile and videos.</li>
              <li>Engage with comments and build repeat viewers, not just one-off clicks.</li>
              <li>Upload consistently so followers see you in their Following feed.</li>
              <li>
                Explore the{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop hub
                </Link>{" "}
                to understand how fans discover new artists.
              </li>
            </ul>
          ),
        },
        {
          title: "Step 4 — Monetization & support",
          children: (
            <p>
              Fan support features (tips, subscriptions, paid access) vary by account and region. See{" "}
              <Link href="/payment-terms" className="font-medium text-primary hover:underline">
                Payment Terms
              </Link>{" "}
              for payout rules. Questions?{" "}
              <Link href="/faq" className="font-medium text-primary hover:underline">
                FAQ
              </Link>{" "}
              or{" "}
              <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                care@hiffi.com
              </a>
              .
            </p>
          ),
        },
        {
          title: "Community & standards",
          children: (
            <p>
              Hiffi is built on respect for artists and fans. No hate speech, harassment, or copyright infringement.
              Full rules are in our{" "}
              <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                Terms of Use
              </Link>
              . Creators making positive impact may qualify for{" "}
              <Link href="/creators-for-change" className="font-medium text-primary hover:underline">
                Creators for Change
              </Link>
              .
            </p>
          ),
        },
      ]}
      cta={{ label: "Apply as a creator", href: "/creator/apply" }}
      secondaryCta={{ label: "How Hiffi works", href: "/how-it-works" }}
      relatedLinks={[
        { label: "Hiffi Artists", href: "/artists" },
        { label: "Hiffi Studio", href: "/studio" },
        { label: "FAQ", href: "/faq" },
      ]}
    />
  )
}
