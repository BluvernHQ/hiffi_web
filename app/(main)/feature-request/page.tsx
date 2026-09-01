import { FeatureRequestForm } from "@/components/feature-request/feature-request-form"
import { FeatureRequestGate } from "@/components/feature-request/feature-request-gate"

export default function FeatureRequestPage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8 sm:py-12 lg:py-14">
        <header className="mb-10 text-center sm:mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            Help shape Hiffi
          </p>
          <h1 className="mt-3 text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
            Request a feature
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            We&apos;re building Hiffi with creators, not just for them. Drop your ideas for tools,
            workflows, or features that would make Hiffi better for your music and your audience.
          </p>
        </header>

        <FeatureRequestGate>
          <FeatureRequestForm />
        </FeatureRequestGate>
      </div>
    </div>
  )
}
