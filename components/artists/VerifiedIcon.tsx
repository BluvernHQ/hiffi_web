import { cn } from "@/lib/utils"

type VerifiedIconProps = {
  className?: string
  title?: string
}

/** Blue scalloped verified badge for claimed/verified artist index profiles. */
export function VerifiedIcon({
  className,
  title = "Verified artist",
}: VerifiedIconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/artist-index/verified-icon.png"
      alt=""
      title={title}
      aria-label={title}
      className={cn("inline-block shrink-0 object-contain", className)}
    />
  )
}
