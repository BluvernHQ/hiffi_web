import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function CopyrightPage() {
  return (
    <ContentPageShell
      path="/copyright"
      eyebrow="Legal"
      title="Copyright & DMCA Policy"
      description="Hiffi respects creators' rights. This page explains how we handle copyright claims, takedown requests, and repeat infringement on the platform."
      sections={[
        {
          title: "Our commitment",
          children: (
            <>
              <p>
                Kinimi Corporation operates Hiffi in compliance with the Digital Millennium Copyright Act (DMCA)
                and applicable intellectual property laws. We respond to valid takedown notices and take action
                against repeat infringers.
              </p>
              <p>
                Creators are responsible for uploading only content they own or have licensed. Fans and artists
                alike benefit when original work is protected.
              </p>
            </>
          ),
        },
        {
          title: "Reporting copyright infringement",
          children: (
            <>
              <p>
                If you believe your copyrighted work has been used on Hiffi without authorization, send a DMCA
                notice to our Copyright Agent at{" "}
                <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                  care@hiffi.com
                </a>
                . Use the subject line &quot;DMCA Takedown Request&quot; and include:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your physical or electronic signature</li>
                <li>Identification of the copyrighted work you claim has been infringed</li>
                <li>
                  Identification of the infringing material on Hiffi (include URLs to the video, profile, or
                  other content)
                </li>
                <li>Your contact information (address, phone number, and email)</li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief the use is not authorized
                </li>
                <li>
                  A statement that the information in your notice is accurate and that you are authorized to act
                  on behalf of the copyright owner
                </li>
              </ul>
            </>
          ),
        },
        {
          title: "Counter-notices",
          children: (
            <>
              <p>
                If your content was removed because of a DMCA notice and you believe the removal was a mistake or
                that you have authorization to use the material, you may submit a counter-notice to{" "}
                <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                  care@hiffi.com
                </a>
                . Your counter-notice must include:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Your physical or electronic signature</li>
                <li>Identification of the content that was removed and its location before removal</li>
                <li>
                  A statement under penalty of perjury that you have a good faith belief the content was removed
                  by mistake or misidentification
                </li>
                <li>Your name, address, and telephone number</li>
                <li>
                  A statement that you consent to the jurisdiction of the U.S. District Court for your district (or,
                  if outside the U.S., any judicial district in which Hiffi may be found)
                </li>
              </ul>
              <p>
                We may restore removed content within 10–14 business days unless we receive notice that legal
                action has been filed.
              </p>
            </>
          ),
        },
        {
          title: "Repeat infringers",
          children: (
            <p>
              Hiffi maintains a policy of terminating accounts of users who are repeat copyright infringers.
              Accounts that receive multiple valid DMCA takedown notices may be suspended or permanently removed.
            </p>
          ),
        },
        {
          title: "Related policies",
          children: (
            <p>
              For full platform rules, see our{" "}
              <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                Terms of Use
              </Link>{" "}
              (Section 7) and{" "}
              <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          ),
        },
      ]}
      cta={{
        label: "Report copyright infringement",
        href: "mailto:care@hiffi.com?subject=DMCA%20Takedown%20Request",
      }}
      secondaryCta={{ label: "Contact support", href: "/support" }}
      relatedLinks={[
        { label: "Terms of Use", href: "/terms-of-use" },
        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Support", href: "/support" },
      ]}
    />
  )
}
