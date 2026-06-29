type ArtistIndexIntroProps = {
  artistCount: number
  title?: string
  description?: string
  compact?: boolean
}

export function ArtistIndexIntro({
  artistCount,
  title,
  description,
  compact = false,
}: ArtistIndexIntroProps) {
  const defaultDescription = `Browse ${artistCount.toLocaleString()}+ claimable hip-hop and rap profiles — starting in Atlanta.`

  if (compact) {
    return (
      <section className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-tight">
          {title ?? (
            <>
              Discover emerging{" "}
              <span
                className="font-normal text-transparent"
                style={{ WebkitTextStroke: "1px rgba(10, 10, 10, 0.85)" }}
              >
                hip-hop & rap
              </span>{" "}
              artists
            </>
          )}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
          {description ?? defaultDescription}
        </p>
      </section>
    )
  }

  return (
    <section className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#E8192C]">
        Hiffi Artist Index
      </p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:leading-tight">
        {title ?? (
          <>
            Discover emerging{" "}
            <span
              className="font-normal text-transparent"
              style={{ WebkitTextStroke: "1.5px rgba(10, 10, 10, 0.85)" }}
            >
              hip-hop & rap
            </span>{" "}
            artists by city
          </>
        )}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description ?? defaultDescription}
      </p>
    </section>
  )
}
