type ArtistIndexHeroProps = {
  artistCount: number
  lastUpdated: string
}

export function ArtistIndexHero({ artistCount, lastUpdated }: ArtistIndexHeroProps) {
  return (
    <section className="text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        The Hiffi{" "}
        <span className="text-[#E8192C]">Artist Index</span>
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
        A ranked directory of hip-hop artists — sorted by total social reach across Instagram,
        YouTube, TikTok, and Facebook.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
        <span>
          Last updated:{" "}
          <span className="font-semibold text-foreground">{lastUpdated}</span>
        </span>
        <span aria-hidden className="hidden sm:inline text-border">
          |
        </span>
        <span>
          Artists tracked:{" "}
          <span className="font-semibold text-foreground">{artistCount.toLocaleString()}</span>
        </span>
      </div>
    </section>
  )
}
