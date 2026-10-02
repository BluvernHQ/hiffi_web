import Link from "next/link"
import { Download } from "lucide-react"
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
                Brand guidelines (PDF) —{" "}
                <a href="/documents/hiffi-brand-guidelines.pdf" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                  Download
                </a>
              </li>
              <li>
                Use the name <strong>Hiffi</strong> (capital H, lowercase iffi). Do not imply endorsement without
                written approval.
              </li>
            </ul>
          ),
        },
        {
          title: "Founder",
          children: (
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
              <img
                src="/inoto-kinimi-founder-photo.jpg"
                alt="Inoto Kinimi, Founder of Hiffi"
                className="w-full rounded-2xl object-cover sm:w-[240px] sm:shrink-0"
              />
              <div className="flex flex-col py-2">
                <h3 className="text-2xl font-bold text-foreground">Inoto Kinimi</h3>
                <p className="mt-1 text-base text-muted-foreground">Founder</p>
                
                <div className="mt-10 flex flex-col items-start gap-3">
                  <a
                    href="/inoto-kinimi-founder-photo.jpg"
                    download="inoto-kinimi-founder-photo.jpg"
                    className="!text-white !no-underline hover:!text-white hover:!no-underline inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E31E24] px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:bg-red-700 hover:shadow-md sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Download founder photo (JPG)
                  </a>
                  <p className="text-sm text-muted-foreground">
                    High-resolution for press use
                  </p>
                </div>
              </div>
            </div>
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
