import Link from "next/link"

/** Terms copy below the creator CTA (safe for client + server imports). */
export function BecomeCreatorTermsNote() {
  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
      By becoming a creator, you agree to our community guidelines and{" "}
      <Link
        href="/terms-of-use"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        terms of service
      </Link>
      .
    </p>
  )
}
