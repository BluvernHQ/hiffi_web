import { Suspense } from "react"
import { BrandCollaborationForm } from "@/components/collaborate/brand-collaboration-form"

export default function CollaboratePage() {
  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-[760px] px-6 py-10 sm:px-8 sm:py-12 lg:py-14">
        <header className="mb-10 text-center sm:mb-12">
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">
            Brand collaboration
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">
            Tell us about your brand and partnership goals.
          </p>
        </header>

        <Suspense fallback={null}>
          <BrandCollaborationForm />
        </Suspense>
      </div>
    </div>
  )
}
