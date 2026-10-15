import { redirect } from "next/navigation"
import { getCreatorWalkthroughCalendlyUrl } from "@/lib/creator-onboarding-links"

export default function BookWalkthroughPage() {
  redirect(getCreatorWalkthroughCalendlyUrl())
}
