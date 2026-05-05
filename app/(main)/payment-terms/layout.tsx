import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payment Terms | Hiffi",
  description: "Review Hiffi payment terms for creator and platform transactions.",
}

export default function PaymentTermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
