import Link from "next/link"
import { ContentPageShell } from "@/components/content/content-page-shell"

export default function CommunityGuidelinesPage() {
  return (
    <ContentPageShell
      path="/community-guidelines"
      eyebrow="House rules"
      title="Community Guidelines"
      description="Hiffi is built on respect for artists, fans, and hip-hop culture. These guidelines explain what we expect from everyone on the platform."
      sections={[
        {
          title: "Our culture",
          children: (
            <p>
              Hiffi celebrates authentic hip-hop — underground rap, emerging talent, and established artists alike.
              We expect members to engage with honesty, creativity, and respect. Harassment, hate, and exploitation
              have no place here.
            </p>
          ),
        },
        {
          title: "Be respectful",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>Treat artists, fans, and moderators with respect in comments, messages, and live interactions.</li>
              <li>Do not harass, bully, threaten, or stalk other users.</li>
              <li>
                Do not promote hatred or discrimination based on race, ethnicity, religion, gender, sexual orientation,
                disability, or other protected characteristics.
              </li>
              <li>Disagree with ideas, not people — critique art, don&apos;t attack identity.</li>
            </ul>
          ),
        },
        {
          title: "Share original, licensed content",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>Upload only content you own or have rights to use — including beats, samples, and visuals.</li>
              <li>Do not upload copyrighted music or videos without proper licensing or permission.</li>
              <li>
                Report infringement through our{" "}
                <Link href="/copyright" className="font-medium text-primary hover:underline">
                  Copyright &amp; DMCA policy
                </Link>
                .
              </li>
            </ul>
          ),
        },
        {
          title: "Keep the community safe",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Zero tolerance</strong> for child sexual abuse material (CSAM), sexual exploitation of minors, or
                content that sexualises minors. Violations are reported to authorities.
              </li>
              <li>No sexually exploitative, non-consensual, or violently abusive content.</li>
              <li>Do not share others&apos; private information without consent.</li>
              <li>Do not promote self-harm, suicide, or dangerous illegal activity.</li>
              <li>No scams, impersonation, or fraudulent schemes targeting users or creators.</li>
            </ul>
          ),
        },
        {
          title: "Creator expectations",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>Represent your work accurately — no misleading titles, thumbnails, or claims.</li>
              <li>Engage your community authentically; don&apos;t spam, bot, or manipulate metrics.</li>
              <li>Follow platform upload standards and processing requirements.</li>
              <li>
                Approved creators agree to Hiffi&apos;s{" "}
                <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                  Terms of Use
                </Link>{" "}
                and these guidelines.
              </li>
            </ul>
          ),
        },
        {
          title: "Enforcement",
          children: (
            <>
              <p>
                We may remove content, restrict features, or suspend accounts that violate these guidelines or our Terms
                of Use. Serious or repeated violations can result in permanent removal. We also cooperate with law
                enforcement when required.
              </p>
              <p>
                See something that breaks the rules? Use in-app Report tools or contact{" "}
                <a href="mailto:care@hiffi.com" className="font-medium text-primary hover:underline">
                  care@hiffi.com
                </a>
                . Track reports at{" "}
                <Link href="/support/reports" className="font-medium text-primary hover:underline">
                  My reports
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          title: "Related policies",
          children: (
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <Link href="/terms-of-use" className="font-medium text-primary hover:underline">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="font-medium text-primary hover:underline">
                  Copyright &amp; DMCA
                </Link>
              </li>
            </ul>
          ),
        },
      ]}
      cta={{ label: "Contact support", href: "/support" }}
      secondaryCta={{ label: "Read Terms of Use", href: "/terms-of-use" }}
      relatedLinks={[
        { label: "FAQ", href: "/faq" },
        { label: "About Hiffi", href: "/about" },
        { label: "Creators for Change", href: "/creators-for-change" },
      ]}
    />
  )
}
