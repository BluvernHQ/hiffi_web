import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function CreatorPlaybookPage() {
  return (
    <ContentPageShell
      path="/creator-playbook"
      eyebrow="Creators"
      title="Creator Playbook"
      description="A practical guide for rappers, producers, and DJs — plan your content, publish strong music videos, get discovered on Hiffi, and build a real fanbase."
      sections={[
        {
          title: "Before you start",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                You need a Hiffi account —{" "}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  sign up free
                </Link>
                .
              </li>
              <li>
                Hip-hop and rap artists can{" "}
                <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                  become a creator instantly
                </Link>{" "}
                after signing up — no waiting period.
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
          title: "Step 1 — Become a creator",
          children: (
            <ol className="list-decimal space-y-2 pl-6">
              <li>Complete your profile with a clear photo and bio.</li>
              <li>
                Go to{" "}
                <Link href="/creator/apply" className="font-medium text-primary hover:underline">
                  Become a Creator
                </Link>{" "}
                and unlock creator access instantly — built for hip-hop, rap, and related artists.
              </li>
              <li>
                Upload tools open right away in{" "}
                <Link href="/studio" className="font-medium text-primary hover:underline">
                  Hiffi Studio
                </Link>{" "}
                and the mobile app.
              </li>
            </ol>
          ),
        },
        {
          title: "Programming — Plan your content",
          children: (
            <>
              <p className="mb-3 text-muted-foreground">
                Think about what role each upload plays on your channel — not every clip needs to be a full music
                video.
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Hero content</strong> — Official music videos, album singles, and major releases. These are
                  your flagship uploads and what new fans should see first on your profile.
                </li>
                <li>
                  <strong>Hub content</strong> — Freestyles, cyphers, studio sessions, and behind-the-scenes clips
                  that keep your profile active between releases.
                </li>
                <li>
                  <strong>Cadence</strong> — Aim for a steady rhythm (for example, every 2–4 weeks) rather than dumping
                  many uploads at once. Followers are more likely to return when you publish on a schedule they can
                  expect.
                </li>
                <li>
                  <strong>Hiffi vs social</strong> — Post full videos on Hiffi; use Instagram, TikTok, and YouTube
                  Shorts for teasers and clips that link back to your Hiffi watch page.
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Publishing & optimization",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Quality</strong> — Use clear audio and stable video. Official music videos in HD perform best
                on Hiffi.
              </li>
              <li>
                <strong>Titles</strong> — Use a clear pattern such as{" "}
                <em>Artist Name – Song Title (Official Video)</em>. Add subgenre (drill, trap, boom bap, etc.) when it
                fits naturally.
              </li>
              <li>
                <strong>Descriptions</strong> — Include credits, city, release context, and official links. A few
                relevant keywords help fans and search find your video — avoid keyword stuffing.
              </li>
              <li>
                <strong>Thumbnails</strong> — Use a strong cover image with readable text and a clear focal point.
                Most fans browse on mobile, so design for small screens.
              </li>
              <li>
                <strong>Hook early</strong> — The first few seconds matter. Start with your strongest visual or musical
                moment so viewers stay past the opening.
              </li>
              <li>
                <strong>Processing</strong> — Videos may show “Processing” briefly after upload. Playback unlocks when
                processing completes — see the{" "}
                <Link href="/faq" className="font-medium text-primary hover:underline">
                  FAQ
                </Link>{" "}
                if a video stays stuck.
              </li>
            </ul>
          ),
        },
        {
          title: "Discovery on Hiffi",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Following feed</strong> — Fans who follow you see new uploads in their Following feed.
                Consistent publishing keeps you visible to people who already care.
              </li>
              <li>
                <strong>Hip-hop hub</strong> — Genre-native surfaces like the{" "}
                <Link href="/hip-hop" className="font-medium text-primary hover:underline">
                  hip-hop hub
                </Link>{" "}
                help fans who came specifically for rap discover new artists.
              </li>
              <li>
                <strong>Home & recommendations</strong> — Hiffi uses discovery systems to surface relevant content.
                Strong titles, thumbnails, and engagement signals help your videos reach the right audience.
              </li>
              <li>
                <strong>Search & profiles</strong> — A complete profile and descriptive video metadata make it easier
                for fans to find you by name, song, or subgenre.
              </li>
              <li>
                <strong>Your profile is your home base</strong> — Lead with your strongest official music video. Many
                fans decide whether to follow based on the first thing they see on your profile.
              </li>
            </ul>
          ),
        },
        {
          title: "Community & growth",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Share direct <strong>watch links</strong> on social — drive fans to a specific video or your profile,
                not just a generic “check my Hiffi.”
              </li>
              <li>
                Reply to <strong>comments</strong>, especially early on. Repeat engagement turns one-time viewers
                into followers.
              </li>
              <li>
                <strong>Collaborate</strong> — Shout out other Hiffi artists, appear in each other&apos;s content,
                and cross-link profiles when it makes sense.
              </li>
              <li>
                Keep your <strong>handle and link in bio</strong> consistent across platforms so fans always know
                where to find your full catalog.
              </li>
              <li>
                Upload on a <strong>regular schedule</strong> so followers have a reason to come back — hub content
                between hero releases works well.
              </li>
            </ul>
          ),
        },
        {
          title: "Rights & community standards",
          children: (
            <p>
              Hiffi is built on respect for artists and fans. Upload only content you own or have rights to use. No
              hate speech, harassment, or copyright infringement. Full rules are in our{" "}
              <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/community-guidelines" className="font-medium text-primary hover:underline">
                Community Guidelines
              </Link>
              . For copyright issues, see our{" "}
              <Link href="/copyright" className="font-medium text-primary hover:underline">
                Copyright Policy
              </Link>
              . Creators making positive impact may qualify for{" "}
              <Link href="/creators-for-change" className="font-medium text-primary hover:underline">
                Creators for Change
              </Link>
              .
            </p>
          ),
        },
        {
          title: "Launch checklist",
          children: (
            <ul className="list-none space-y-2 pl-0">
              {[
                "Hiffi account created",
                "Became a creator on Hiffi",
                "Profile photo and bio complete",
                "First official music video uploaded",
                "Title, description, and thumbnail optimized for mobile",
                "Watch link shared on at least one social platform",
                "Replied to early comments on your first upload",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-muted-foreground" aria-hidden="true">
                    ☐
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
      cta={{ label: "Become a creator", href: "/creator/apply" }}
      secondaryCta={{ label: "How Hiffi works", href: "/how-it-works" }}
      relatedLinks={[
        { label: "Hiffi Artists", href: "/artists" },
        { label: "Hiffi Studio", href: "/studio" },
        { label: "FAQ", href: "/faq" },
      ]}
    />
  )
}
