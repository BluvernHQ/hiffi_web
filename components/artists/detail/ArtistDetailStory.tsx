"use client"

import { useState } from "react"
import Link from "next/link"
import type { Artist } from "@/lib/artists"
import { ArtistDetailEyebrow } from "@/components/artists/detail/ArtistDetailSection"
import { artistClaimState, cleanArtistBio } from "@/components/artists/detail/artist-detail-data"

const LEDE_MAX = 260
const COLLAPSED_PARAGRAPHS = 2

function splitLede(paragraphs: string[]): { lede: string; rest: string[] } {
  const [first, ...rest] = paragraphs
  if (first.length <= LEDE_MAX) return { lede: first, rest }

  const sentences = first.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [first]
  let lede = ""
  for (const sentence of sentences) {
    if (lede && (lede + sentence).length > LEDE_MAX) break
    lede += sentence
  }
  const remainder = first.slice(lede.length).trim()
  return { lede: lede.trim(), rest: remainder ? [remainder, ...rest] : rest }
}

export function ArtistDetailStory({ artist }: { artist: Artist }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = cleanArtistBio(artist.bio)
  const claimState = artistClaimState(artist)

  if (paragraphs.length === 0) {
    return (
      <section aria-labelledby="artist-story">
        <ArtistDetailEyebrow>The story</ArtistDetailEyebrow>
        <h2 id="artist-story" className="sr-only">
          About {artist.name}
        </h2>
        <p className="mt-5 max-w-xl text-xl leading-snug tracking-[-0.01em] text-[#0B0B0C]/45 sm:text-2xl">
          {claimState === "verified" ? (
            <>{artist.name} hasn’t written their story yet.</>
          ) : (
            <>
              This page is waiting for {artist.name}’s own words.{" "}
              <Link
                href={`/artist-index/${artist.slug}/claim`}
                className="text-[#0B0B0C] underline decoration-[#E8192C] decoration-2 underline-offset-[6px]"
              >
                Claim it
              </Link>{" "}
              to tell your story.
            </>
          )}
        </p>
      </section>
    )
  }

  const { lede, rest } = splitLede(paragraphs)
  const collapsible = rest.length > COLLAPSED_PARAGRAPHS
  const visible = expanded || !collapsible ? rest : rest.slice(0, COLLAPSED_PARAGRAPHS)

  return (
    <section aria-labelledby="artist-story">
      <ArtistDetailEyebrow>The story</ArtistDetailEyebrow>
      <h2 id="artist-story" className="sr-only">
        About {artist.name}
      </h2>
      <p className="mt-5 max-w-2xl text-[1.35rem] font-medium leading-[1.4] tracking-[-0.015em] text-[#0B0B0C] sm:text-[1.6rem]">
        {lede}
      </p>
      {visible.length > 0 ? (
        <div className="mt-6 max-w-2xl space-y-4 text-[15px] leading-7 text-[#3B3833]">
          {visible.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : null}
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-5 text-sm font-semibold text-[#0B0B0C] underline decoration-[#0B0B0C]/25 underline-offset-4 transition-colors hover:decoration-[#E8192C]"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read the full story"}
        </button>
      ) : null}
    </section>
  )
}
