import type { AtlantaHubCategoryCard } from "./types"

export const ATLANTA_HUB = {
  title: "Atlanta Hip-Hop Guide",
  description:
    "Explore Atlanta hip-hop culture through independent artists, rap music, subgenres, studios, venues, and curated guides. Discover official music videos, artist profiles, and the latest talent on Hiffi.",
  intro:
    "Atlanta isn’t just a city tag — it’s a full stack of sounds, rooms, labels, and timelines. Start with a genre hub, jump into a best-of list, or walk eras in order.",
  keywords: [
    "atlanta hip-hop",
    "atlanta trap",
    "atl hip-hop guide",
    "atlanta music scene",
  ],
}

export const ATLANTA_HUB_CATEGORIES: AtlantaHubCategoryCard[] = [
  {
    category: "genres",
    title: "Genres",
    description: "Trap, crunk, snap, Dirty South, trap-soul, and conscious Atlanta hubs.",
    href: "/atlanta/genres",
  },
  {
    category: "best-of",
    title: "Best-of lists",
    description: "Essential tracks, albums, mixtapes, producers, and anthems.",
    href: "/atlanta/best-of",
  },
  {
    category: "eras",
    title: "Eras",
    description: "From bass & booty through trap’s golden age to Atlanta now.",
    href: "/atlanta/eras",
  },
  {
    category: "studios",
    title: "Studios & producers",
    description: "Rooms, labels, and producer profiles that shaped the sound.",
    href: "/atlanta/studios",
  },
  {
    category: "venues",
    title: "Venues",
    description: "Clubs and concert rooms in Atlanta’s live and nightlife map.",
    href: "/atlanta/venues",
  },
]

export const ATLANTA_HUB_QUICK_LINKS = [
  { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
  { label: "25 Essential Atlanta Trap Tracks", href: "/atlanta/best-of/essential-atlanta-trap-tracks" },
  { label: "Birth of Trap", href: "/atlanta/eras/birth-of-trap" },
  { label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" },
  { label: "Atlanta scene guide", href: "/artist-index/city/atlanta/scene" },
  { label: "On Sight mood mix", href: "/hip-hop/mood/on-sight" },
]
