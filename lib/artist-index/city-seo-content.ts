import { artistIndexGenreHref } from "@/lib/artist-directory"

export type CityFaqItem = {
  question: string
  answer: string
}

export const ATLANTA_CITY_FAQ: CityFaqItem[] = [
  {
    question: "Who are the best emerging Atlanta rappers on Hiffi?",
    answer:
      "The Hiffi Artist Index lists 800+ emerging Atlanta hip-hop and rap artists — searchable by name, genre, and claim status. Browse verified and unclaimed profiles at hiffi.com/artist-index/city/atlanta, then follow official links or watch music videos on Hiffi.",
  },
  {
    question: "How is the Hiffi Artist Index different from Spotify or Genius?",
    answer:
      "Spotify and Genius focus on released music and credits. The Hiffi Artist Index is a claimable directory built for the Atlanta scene — artists verify their profile, update links, and connect fans to official music videos on Hiffi.",
  },
  {
    question: "How do I claim my Atlanta rapper profile on Hiffi?",
    answer:
      "Search your stage name on the Artist Index, open your profile, and select Claim your profile. After verification, you can update your bio, links, and upload music videos on Hiffi.",
  },
  {
    question: "What Atlanta hip-hop subgenres are in the index?",
    answer:
      "The Atlanta index includes trap, drill, melodic rap, underground rap, conscious rap, and related Southern hip-hop styles. Filter by genre on the Artist Index or browse trap and rap artist pages directly.",
  },
]

export function getAtlantaSceneSections(profileCount: number): Array<{ heading: string; paragraphs: string[] }> {
  const countLabel = profileCount > 0 ? `${profileCount.toLocaleString()}+` : "800+"

  return [
    {
      heading: "Atlanta hip-hop & rap scene",
      paragraphs: [
        `Atlanta is one of the most influential hip-hop markets in the world — the city behind trap's global rise, a constant pipeline of underground talent, and a scene where independent artists build audiences before major label attention.`,
        `From Zone 6 to the broader ATL metro, Atlanta rap spans trap, drill, melodic rap, conscious hip-hop, and street-ready underground sounds. Fans search for emerging artists by name, neighborhood energy, and subgenre — not only chart placements.`,
      ],
    },
    {
      heading: `Why Hiffi indexed ${countLabel} Atlanta artists`,
      paragraphs: [
        `Hiffi built the Artist Index so fans and artists can discover the Atlanta scene in one place. The directory currently lists ${countLabel} hip-hop and rap profiles from Atlanta — each with claimable listings, official social links, and a path to music videos on Hiffi.`,
        `Independent artists often lack a single verified home online. The index gives each artist a canonical Hiffi profile URL, helps fans find the right person, and lets artists claim and correct their listing.`,
      ],
    },
    {
      heading: "Subgenres in the Atlanta index",
      paragraphs: [
        `Atlanta profiles on Hiffi cover trap, drill, melodic rap, underground rap, boom bap-influenced sounds, and conscious rap. Browse by genre on the Artist Index or explore mood-based hip-hop discovery on Hiffi.`,
      ],
    },
    {
      heading: "For fans and artists",
      paragraphs: [
        `Fans: search by name, browse new profiles, and use official Spotify, YouTube, and Instagram links on each artist page.`,
        `Artists: find your profile, claim it, update your bio and links, and upload music videos on Hiffi. Claiming is free and does not auto-upload your catalog — you control what goes live.`,
      ],
    },
  ]
}

export function getAtlantaGenreLinks(): Array<{ label: string; href: string }> {
  return [
    { label: "Trap artists", href: artistIndexGenreHref("trap") },
    { label: "Rap artists", href: artistIndexGenreHref("rap") },
    { label: "Drill artists", href: artistIndexGenreHref("drill") },
    { label: "Hip-Hop hub", href: "/hip-hop" },
  ]
}

export function getCityFaqForSlug(citySlug: string): CityFaqItem[] | null {
  if (citySlug === "atlanta") return ATLANTA_CITY_FAQ
  return null
}

export const ATLANTA_SCENE_PAGE_TITLE = "Atlanta Hip-Hop Scene — Trap, Drill & Underground Rap"

export function buildAtlantaScenePageDescription(profileCount?: number): string {
  const countLabel = profileCount != null && profileCount > 0 ? `${profileCount.toLocaleString()}+` : "800+"
  return `Guide to the Atlanta hip-hop scene on Hiffi — trap, drill, melodic rap, and underground ATL talent. Browse ${countLabel} indexed artist profiles in the directory.`
}

export const ATLANTA_SCENE_KEYWORDS = [
  "Atlanta hip-hop scene",
  "ATL rap scene",
  "Atlanta trap scene",
  "Atlanta drill rap",
  "underground Atlanta rap",
  "emerging Atlanta rappers",
  "Southern hip-hop Atlanta",
] as const

export function getAtlantaSceneTeaser(profileCount: number): string {
  const countLabel = profileCount > 0 ? `${profileCount.toLocaleString()}+` : "800+"
  return `Hiffi indexes ${countLabel} Atlanta hip-hop and rap artists — trap, drill, melodic rap, and underground talent from the ATL scene.`
}
