import { BecomeCreatorMarketing } from "@/components/creator/become-creator-marketing"
import { BecomeCreatorCta } from "./become-creator-cta"
import { CreatorApplyGate } from "@/components/creator/creator-apply-gate"

export default function BecomeCreatorPage() {
  return (
    <CreatorApplyGate>
      <BecomeCreatorMarketing cta={<BecomeCreatorCta />} />
    </CreatorApplyGate>
  )
}
