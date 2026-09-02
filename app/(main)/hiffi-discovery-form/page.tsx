import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DiscoverySourceForm } from "@/components/discovery-source/discovery-source-form"
import { sanitizeDiscoveryPrefill } from "@/lib/discovery-source/sanitize-prefill"
import { routeMetadata } from "@/lib/seo/route-metadata"

export const metadata: Metadata = routeMetadata({
  title: "How did you find Hiffi?",
  description:
    "Tell us how you discovered Hiffi — your name, email, and where you heard about us. Helps us improve creator outreach and discovery.",
  path: "/hiffi-discovery-form",
  index: false,
})

type HiffiDiscoveryFormPageProps = {
  searchParams: Promise<{ name?: string; email?: string }>
}

export default async function HiffiDiscoveryFormPage({
  searchParams,
}: HiffiDiscoveryFormPageProps) {
  const params = await searchParams

  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Hiffi
        </Link>

        <div className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E8192C]">
            Welcome to Hiffi
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How did you find us?
          </h1>
          <p className="text-base text-muted-foreground">
            We&apos;re always learning how creators and fans discover Hiffi. Share your name,
            email, and where you heard about us — it only takes a moment.
          </p>
        </div>

        <DiscoverySourceForm
          initialName={sanitizeDiscoveryPrefill(params.name)}
          initialEmail={sanitizeDiscoveryPrefill(params.email)}
        />
      </div>
    </div>
  )
}
