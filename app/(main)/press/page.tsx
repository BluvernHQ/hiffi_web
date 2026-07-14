import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function PressPage() {
  return (
    <ContentPageShell
      path="/press"
      eyebrow="Media"
      title="Press kit"
      description="Resources for journalists, podcasters, and partners covering Hiffi — the artist-first hip-hop streaming platform at hiffi.com."
      sections={[
        {
          title: "Company overview",
          children: (
            <>
              <p>
                <strong>Hiffi</strong> is a hip-hop-first music and video streaming platform where independent artists
                publish official music videos and fans discover rap culture without algorithmic gatekeeping. Hiffi is
                operated by <strong>Kinimi Corporation</strong>.
              </p>
              <p>
                For a full introduction, see{" "}
                <Link href="/what-is-hiffi" className="font-medium text-primary hover:underline">
                  What is Hiffi?
                </Link>{" "}
                and{" "}
                <Link href="/about" className="font-medium text-primary hover:underline">
                  About Hiffi
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          title: "Boilerplate",
          children: (
            <blockquote className="border-l-4 border-primary/40 pl-4 italic text-foreground/80">
              Hiffi is the artist-first streaming platform built for hip-hop. Independent rappers, producers, and DJs
              share music videos and connect with fans who came specifically for the culture — on web and mobile at
              hiffi.com.
            </blockquote>
          ),
        },
        {
          title: "Brand assets",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Logo (PNG) —{" "}
                <a href="/hiffi_logo.png" className="font-medium text-primary hover:underline">
                  Download
                </a>
              </li>
              <li>
                App bar logo —{" "}
                <a href="/appbarlogo.png" className="font-medium text-primary hover:underline">
                  Download
                </a>
              </li>
              <li>
                Use the name <strong>Hiffi</strong> (capital H, lowercase iff). Do not imply endorsement without
                written approval.
              </li>
            </ul>
          ),
        },
        {
          title: "Media contact",
          children: (
            <>
              <p>For press inquiries, interviews, and partnership requests:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Email:{" "}
                  <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                    care@hiffi.com
                  </a>{" "}
                  (subject: Press Inquiry)
                </li>
                <li>
                  Brand partnerships:{" "}
                  <Link href="/collaborate" className="font-medium text-primary hover:underline">
                    Brand collaboration form
                  </Link>
                </li>
                <li>
                  Advertising:{" "}
                  <Link href="/advertising" className="font-medium text-primary hover:underline">
                    Hiffi Advertising
                  </Link>
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Quick facts",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Website:</strong>{" "}
                <Link href="/" className="font-medium text-primary hover:underline">
                  hiffi.com
                </Link>
              </li>
              <li>
                <strong>Apps:</strong>{" "}
                <Link href="/app" className="font-medium text-primary hover:underline">
                  iOS and Android
                </Link>
              </li>
              <li>
                <strong>Focus:</strong> Hip-hop, rap, and independent music video culture
              </li>
              <li>
                <strong>Operator:</strong> Kinimi Corporation
              </li>
            </ul>
          ),
        },
      ]}
      cta={{
        label: "Email press inquiries",
        href: "mailto:care@hiffi.com?subject=Press%20Inquiry",
      }}
      secondaryCta={{ label: "Brand collaboration", href: "/collaborate" }}
      relatedLinks={[
        { label: "About Hiffi", href: "/about" },
        { label: "Advertising", href: "/advertising" },
        { label: "Support", href: "/support" },
      ]}
    />
  )
}
