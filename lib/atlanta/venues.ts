import type { AtlantaProfilePage } from "./types"

export const ATLANTA_VENUES: AtlantaProfilePage[] = [
  {
    slug: "club-crucial",
    title: "Club Crucial (legacy)",
    description:
      "Club Crucial — T.I.–owned Bankhead club (opened 2005), part of Atlanta hip-hop nightlife history and tied to the ATL (2006) film era.",
    kind: "venue",
    keywords: ["club crucial", "bankhead atlanta", "t.i. club", "atl nightlife hip-hop"],
    intro:
      "Legacy Bankhead room: Club Crucial was T.I.–owned and opened in 2005 — a local test kitchen for Atlanta street records before they went national.",
    bio: "Club Crucial sat in Atlanta’s westside/Bankhead nightlife layer. Treat as historical/cultural context: ownership and era are well-cited; prefer factual framing over nostalgia marketing.",
    neighborhood: "Bankhead / Atlanta",
    address: "Atlanta, GA",
    notable: [
      "T.I.–owned Atlanta club",
      "Opened 2005 in Bankhead",
      "Tied to Atlanta hip-hop nightlife and the ATL (2006) film/soundtrack era",
    ],
    timeline: [
      { year: "2005", label: "Club Crucial opens under T.I. ownership" },
      { year: "2006", label: "ATL film era — Club Crucial in the city’s cultural snapshot" },
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Crunk Music Hub", href: "/atlanta/genres/crunk" },
          { label: "Birth of Trap", href: "/atlanta/eras/birth-of-trap" },
          { label: "Grand Hustle Records", href: "/atlanta/studios/grand-hustle-records" },
          { label: "Magic City", href: "/atlanta/venues/magic-city" },
        ],
      },
    ],
  },
  {
    slug: "magic-city",
    title: "Magic City",
    description:
      "Magic City — culturally significant Atlanta venue in hip-hop nightlife history. Covered factually as a scene institution.",
    kind: "venue",
    keywords: ["magic city atlanta", "atlanta hip-hop venue", "atl nightlife"],
    intro:
      "Culturally significant — treat carefully and factually. Magic City is frequently cited in hip-hop oral history as a place where records and reputations moved.",
    bio: "This page notes Magic City’s role in Atlanta hip-hop nightlife culture without glamorizing harm. Focus on music-history citations, artist mentions in interviews, and the venue’s place in Southern club ecosystems.",
    neighborhood: "Atlanta",
    address: "Atlanta, GA",
    notable: [
      "Frequently referenced in hip-hop cultural history",
      "Associated with Atlanta club-record feedback loops",
      "Handle copy with care — cultural institution framing, not sensationalism",
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Crunk Music Hub", href: "/atlanta/genres/crunk" },
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
          { label: "Atlanta's Biggest Hip-Hop Anthems", href: "/atlanta/best-of/atlanta-biggest-anthems" },
        ],
      },
    ],
  },
  {
    slug: "clermont-lounge",
    title: "The Clermont Lounge",
    description: "The Clermont Lounge — iconic Atlanta nightlife institution with long cultural footprint.",
    kind: "venue",
    keywords: ["clermont lounge", "atlanta venue", "atlanta nightlife"],
    intro: "A long-running Atlanta nightlife name that sits adjacent to music culture as much as nightlife tourism.",
    bio: "Include as local flavor and cultural landmark. Keep descriptions grounded; this is not primarily a concert hall page.",
    neighborhood: "Poncey-Highland / Atlanta",
    notable: ["Long-running Atlanta nightlife landmark", "Cultural reference point in local lore"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta venues index", href: "/atlanta/venues" },
          { label: "Atlanta hub", href: "/atlanta" },
        ],
      },
    ],
  },
  {
    slug: "center-stage",
    title: "Center Stage",
    description: "Center Stage — Atlanta live music venue for concerts and hip-hop shows.",
    kind: "venue",
    keywords: ["center stage atlanta", "atlanta concert venue"],
    intro: "A mid-size Atlanta live room where touring and local hip-hop bills regularly land.",
    bio: "Useful browse page for fans mapping Atlanta’s concert circuit. Expand with notable past hip-hop shows in editorial.",
    neighborhood: "Midtown / Atlanta",
    address: "Atlanta, GA",
    notable: ["Active concert venue", "Common stop for hip-hop touring bills"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "The Tabernacle", href: "/atlanta/venues/the-tabernacle" },
          { label: "Aisle 5", href: "/atlanta/venues/aisle-5" },
          { label: "Atlanta Hip-Hop Now", href: "/atlanta/eras/atlanta-hip-hop-now" },
        ],
      },
    ],
  },
  {
    slug: "the-tabernacle",
    title: "The Tabernacle",
    description: "The Tabernacle — historic Atlanta concert venue hosting major hip-hop and live events.",
    kind: "venue",
    keywords: ["tabernacle atlanta", "atlanta concert hall"],
    intro: "Converted historic space, modern concert calendar — one of Atlanta’s signature live rooms.",
    bio: "The Tabernacle anchors bigger Atlanta show nights. Cross-link to eras and artist discovery rather than dumping full setlists here.",
    neighborhood: "Downtown / Atlanta",
    address: "Atlanta, GA",
    notable: ["Historic building, modern concerts", "Major Atlanta live destination"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Center Stage", href: "/atlanta/venues/center-stage" },
          { label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" },
        ],
      },
    ],
  },
  {
    slug: "aisle-5",
    title: "Aisle 5",
    description: "Aisle 5 — East Atlanta live venue for emerging and mid-level hip-hop and indie bills.",
    kind: "venue",
    keywords: ["aisle 5 atlanta", "east atlanta venue"],
    intro: "East Atlanta’s intimate room energy — good for emerging artists and local bills.",
    bio: "Position Aisle 5 as a discovery-friendly live stop. Pair with Artist Index for who’s rising locally.",
    neighborhood: "East Atlanta",
    notable: ["Intimate East Atlanta room", "Emerging-artist friendly"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta Hip-Hop Now", href: "/atlanta/eras/atlanta-hip-hop-now" },
          { label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" },
          { label: "District Atlanta", href: "/atlanta/venues/vinyl-district-atlanta" },
        ],
      },
    ],
  },
  {
    slug: "vinyl-district-atlanta",
    title: "District Atlanta",
    description:
      "District Atlanta — Midtown nightlife venue. Primarily EDM/house programming; weaker hip-hop-first fit than the cluster's core rooms. (Slug kept for URL stability; \"Vinyl\" pairing dropped as unverified.)",
    kind: "venue",
    keywords: ["district atlanta", "atlanta nightlife", "midtown atlanta club"],
    intro:
      "District Atlanta is a real Midtown nightlife room, but its identity skews EDM/house more than hip-hop. Included for metro completeness with honest framing — not a primary hip-hop landmark.",
    bio: "Earlier drafts paired this page with \"Vinyl,\" which could not be cleanly verified as a co-named hip-hop venue. This page covers District Atlanta only. Prefer current, checkable programming notes over nostalgia claims.",
    neighborhood: "Midtown / Atlanta",
    address: "Atlanta, GA",
    notable: [
      "Primarily EDM / house nightlife identity",
      "Weaker hip-hop-first fit than Tabernacle, Center Stage, or Magic City",
      "\"Vinyl\" co-branding dropped from this page as unverified",
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Center Stage", href: "/atlanta/venues/center-stage" },
          { label: "Aisle 5", href: "/atlanta/venues/aisle-5" },
          { label: "Atlanta venues index", href: "/atlanta/venues" },
        ],
      },
    ],
  },
  {
    slug: "wild-bills",
    title: "Wild Bill's (Duluth, greater ATL)",
    description:
      "Wild Bill's — large Duluth, GA concert and dance venue (5,000+ capacity). General metro-ATL nightlife footprint; not a hip-hop-first room.",
    kind: "venue",
    keywords: ["wild bills duluth", "wild bills atlanta", "greater atlanta venue"],
    intro:
      "Greater-ATL footprint in Duluth: a large concert/dance room (5,000+ capacity). Identity skews country, line-dancing, and general concerts more than hip-hop — weaker cluster fit than Atlanta’s core hip-hop rooms, included for metro completeness.",
    bio: "Wild Bill’s is a major-capacity suburban Atlanta venue. Treat it as regional nightlife/concert infrastructure rather than a hip-hop landmark. Confirm current programming before any “go tonight” language.",
    neighborhood: "Duluth / greater Atlanta",
    address: "Duluth, GA",
    notable: [
      "Located in Duluth, GA (not Stone Mountain)",
      "Large-capacity concert/dance venue (5,000+)",
      "Programming leans country / line-dancing / general concerts more than hip-hop",
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta venues index", href: "/atlanta/venues" },
          { label: "The Tabernacle", href: "/atlanta/venues/the-tabernacle" },
          { label: "Center Stage", href: "/atlanta/venues/center-stage" },
        ],
      },
    ],
  },
]
