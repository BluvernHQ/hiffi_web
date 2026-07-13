import type { AtlantaProfilePage } from "./types"

export const ATLANTA_STUDIOS: AtlantaProfilePage[] = [
  {
    slug: "patchwerk-studios",
    title: "Patchwerk Recording Studios",
    description: "Patchwerk Recording Studios — Atlanta institution for hip-hop and R&B sessions.",
    kind: "studio",
    keywords: ["patchwerk studios", "atlanta recording studio", "atl hip-hop studio"],
    intro: "One of Atlanta’s best-known commercial rooms — a working studio name that shows up across decades of Southern credits.",
    bio: "Patchwerk has long been part of Atlanta’s session infrastructure: artists, producers, and engineers passing through a facility built for serious tracking and mixing. Expand with notable session lore in editorial.",
    neighborhood: "Atlanta",
    notable: ["Long-running Atlanta commercial studio", "Hip-hop and R&B session hub", "Credits spanning multiple eras"],
    timeline: [
      { year: "1990s+", label: "Established as a major ATL room" },
      { year: "2000s–2010s", label: "Credits across mainstream Southern releases" },
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Tree Sound Studios", href: "/atlanta/studios/tree-sound-studios" },
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
          { label: "Atlanta Artist Index", href: "/artist-index/city/atlanta" },
        ],
      },
    ],
  },
  {
    slug: "stankonia-recording",
    title: "Stankonia Recording",
    description: "Stankonia Recording — OutKast-associated Atlanta studio lore and Dungeon Family adjacency.",
    kind: "studio",
    keywords: ["stankonia", "stankonia recording", "outkast studio", "atlanta"],
    intro: "Stankonia is both album title and studio mythos — shorthand for Atlanta’s experimental Southern peak.",
    bio: "Tied to OutKast and the wider Dungeon Family creative world, Stankonia Recording sits at the intersection of facility and cultural symbol. Keep copy factual; expand with verified session history later.",
    neighborhood: "Atlanta",
    notable: ["OutKast / Dungeon Family association", "Symbol of ATL creative independence", "Bridge between 1990s foundation and 2000s expansion"],
    timeline: [
      { year: "Late 1990s–2000s", label: "Peak cultural visibility with OutKast era" },
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "The Dungeon Family Era", href: "/atlanta/eras/dungeon-family-era" },
          { label: "Organized Noize", href: "/atlanta/studios/organized-noize" },
          { label: "Atlanta Hip-Hop in the 1990s", href: "/atlanta/eras/atlanta-hip-hop-1990s" },
        ],
      },
    ],
  },
  {
    slug: "tree-sound-studios",
    title: "Tree Sound Studios",
    description: "Tree Sound Studios — Atlanta-area recording facility known across rock, pop, and hip-hop sessions.",
    kind: "studio",
    keywords: ["tree sound studios", "atlanta studio", "norcross studio"],
    intro: "A major Atlanta-metro facility with a broad credit history — useful cross-link for studio-hopping readers.",
    bio: "Tree Sound has hosted a wide range of artists over the years. This stub focuses on its place in Atlanta’s recording map rather than a full credit dump.",
    neighborhood: "Atlanta metro",
    notable: ["Large-format Atlanta-area facility", "Multi-genre session history"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Patchwerk Recording Studios", href: "/atlanta/studios/patchwerk-studios" },
          { label: "Doppler Studios", href: "/atlanta/studios/doppler-studios" },
        ],
      },
    ],
  },
  {
    slug: "doppler-studios",
    title: "Doppler Studios (legacy)",
    description: "Doppler Studios — legacy Atlanta recording room with deep Southern music history.",
    kind: "studio",
    keywords: ["doppler studios", "atlanta legacy studio"],
    intro: "Legacy tag: Doppler is part of Atlanta’s older studio layer — important historically even when not the current headline room.",
    bio: "Use this page for legacy context and cross-links into 1990s/2000s eras. Confirm operating status carefully before any “visit today” framing.",
    neighborhood: "Atlanta",
    notable: ["Legacy Atlanta recording facility", "Southern music session history"],
    timeline: [{ year: "Legacy", label: "Historical Atlanta studio footprint" }],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta Hip-Hop in the 1990s", href: "/atlanta/eras/atlanta-hip-hop-1990s" },
          { label: "LaFace Records", href: "/atlanta/studios/laface-records" },
        ],
      },
    ],
  },
  {
    slug: "so-so-def",
    title: "So So Def",
    description: "So So Def — Jermaine Dupri’s Atlanta label and its imprint on Southern pop-rap and R&B.",
    kind: "label",
    keywords: ["so so def", "jermaine dupri", "atlanta label"],
    intro: "So So Def branded Atlanta as polished, catchy, and commercially lethal — hip-hop and R&B under one roof.",
    bio: "Founded by Jermaine Dupri, So So Def helped define how Atlanta could sound on national radio without diluting Southern identity. Expand with roster timelines in editorial.",
    neighborhood: "Atlanta",
    notable: ["Jermaine Dupri imprint", "Radio-ready Southern pop-rap/R&B", "Long cultural brand recognition"],
    timeline: [
      { year: "1990s", label: "Label rise with Atlanta mainstream breakthroughs" },
      { year: "2000s+", label: "Continued brand presence across eras" },
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Dirty South Hub", href: "/atlanta/genres/dirty-south" },
          { label: "LaFace Records", href: "/atlanta/studios/laface-records" },
          { label: "Atlanta Hip-Hop in the 1990s", href: "/atlanta/eras/atlanta-hip-hop-1990s" },
        ],
      },
    ],
  },
  {
    slug: "laface-records",
    title: "LaFace Records",
    description: "LaFace Records — Atlanta label powerhouse behind era-defining Southern and R&B stars.",
    kind: "label",
    keywords: ["laface records", "atlanta label", "l.a. reid babyface"],
    intro: "LaFace put Atlanta on the major-label map with a roster that spanned hip-hop adjacency and global R&B.",
    bio: "Co-founded by Antonio “L.A.” Reid and Kenneth “Babyface” Edmonds, LaFace is foundational infrastructure for 1990s Atlanta. Keep artist lists factual and expandable.",
    neighborhood: "Atlanta",
    notable: ["1990s Atlanta industry cornerstone", "OutKast and broader roster legacy", "Bridge to national distribution"],
    timeline: [{ year: "1989+", label: "Label era begins; Atlanta pipeline strengthens" }],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta Hip-Hop in the 1990s", href: "/atlanta/eras/atlanta-hip-hop-1990s" },
          { label: "The Dungeon Family Era", href: "/atlanta/eras/dungeon-family-era" },
          { label: "So So Def", href: "/atlanta/studios/so-so-def" },
        ],
      },
    ],
  },
  {
    slug: "grand-hustle-records",
    title: "Grand Hustle Records",
    description: "Grand Hustle Records — T.I.’s Atlanta label and trap-era artist platform.",
    kind: "label",
    keywords: ["grand hustle", "t.i. label", "atlanta trap label"],
    intro: "Grand Hustle packaged trap ambition as a brand: artists, street buzz, and mainstream penetration.",
    bio: "Associated with T.I., Grand Hustle is a key institutional name for mid-2000s onward Atlanta trap commerce. Expand roster notes carefully.",
    neighborhood: "Atlanta",
    notable: ["T.I.–associated label", "Trap-era platform", "Bridge from street buzz to retail"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Birth of Trap", href: "/atlanta/eras/birth-of-trap" },
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
          { label: "Best ATL Albums of the 2000s", href: "/atlanta/best-of/best-atl-albums-2000s" },
        ],
      },
    ],
  },
  {
    slug: "quality-control-music",
    title: "Quality Control Music",
    description: "Quality Control Music — Atlanta label machine behind Migos-era and streaming-era stars.",
    kind: "label",
    keywords: ["quality control music", "qc atlanta", "migos label"],
    intro: "QC turned Atlanta’s 2010s wave into a disciplined rollout machine — singles, internet moments, then global scale.",
    bio: "Quality Control is central to how streaming-era Atlanta looked from the outside: coordinated drops, strong branding, and a deep bench. Keep bios current as the roster evolves.",
    neighborhood: "Atlanta",
    notable: ["Streaming-era Atlanta label power", "Migos-era cultural peak association", "Playlist-era playbook"],
    timeline: [{ year: "2010s", label: "National breakout with trap’s streaming generation" }],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Atlanta Hip-Hop in the 2010s", href: "/atlanta/eras/atlanta-hip-hop-2010s" },
          { label: "Trap's Golden Age", href: "/atlanta/eras/trap-golden-age" },
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
        ],
      },
    ],
  },
  {
    slug: "organized-noize",
    title: "Hitmen / Organized Noize",
    description: "Organized Noize — Atlanta producer collective behind Dungeon Family’s signature sound.",
    kind: "producer",
    keywords: ["organized noize", "dungeon family producers", "atlanta producers"],
    intro: "Organized Noize (Rico Wade, Ray Murray, Sleepy Brown) wrote a huge chapter of Atlanta’s musical identity.",
    bio: "As a producer collective, Organized Noize shaped Goodie Mob, OutKast-adjacent worlds, and a live-instrument Southern aesthetic that still gets cited as Atlanta’s artistic conscience.",
    neighborhood: "East Point / Atlanta",
    notable: ["Dungeon Family production core", "Live/Southern alternative hip-hop palette", "Mentor energy for a generation"],
    timeline: [
      { year: "1990s", label: "Breakout with Dungeon Family catalog" },
      { year: "2000s+", label: "Legacy influence across ATL production" },
    ],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "The Dungeon Family Era", href: "/atlanta/eras/dungeon-family-era" },
          { label: "Stankonia Recording", href: "/atlanta/studios/stankonia-recording" },
          { label: "20 Atlanta Producers You Should Know", href: "/atlanta/best-of/atlanta-producers-to-know" },
          { label: "Conscious Rap (Atlanta) Hub", href: "/atlanta/genres/conscious-rap-atlanta" },
        ],
      },
    ],
  },
  {
    slug: "zaytoven",
    title: "Zaytoven",
    description: "Zaytoven — Atlanta piano-trap architect and prolific street-to-mainstream producer.",
    kind: "producer",
    keywords: ["zaytoven", "atlanta producer", "piano trap"],
    intro: "Church keys meet trap drums — Zaytoven’s sound became a dialect inside Atlanta’s producer language.",
    bio: "Xavier Dotson, known as Zaytoven, helped define a melodic-yet-hard Atlanta trap feel across countless street records and mainstream hits. Cross-link into trap hubs and producer lists.",
    neighborhood: "Atlanta",
    notable: ["Piano-trap signature", "Prolific ATL street catalog", "Bridge across Gucci/Future-era sounds"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
          { label: "Trap's Golden Age", href: "/atlanta/eras/trap-golden-age" },
          { label: "20 Atlanta Producers You Should Know", href: "/atlanta/best-of/atlanta-producers-to-know" },
        ],
      },
    ],
  },
  {
    slug: "metro-boomin-atl-roots",
    title: "Metro Boomin — ATL roots",
    description: "Metro Boomin’s Atlanta roots — how a modern trap architect emerged from the city’s producer culture.",
    kind: "producer",
    keywords: ["metro boomin", "atlanta producer", "trap producer"],
    intro: "Metro’s tag is global, but the roots are Atlanta producer culture: mentorship paths, street buzz, then stadium scores.",
    bio: "This page frames Metro Boomin through an Atlanta lens — early co-signs, local network effects, and the city’s trap golden age — without pretending every later credit is “local only.”",
    neighborhood: "Atlanta / St. Louis roots with ATL rise",
    notable: ["Modern trap orchestral minimalism", "Key 2010s Atlanta co-signs", "Producer-as-brand model"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Trap's Golden Age", href: "/atlanta/eras/trap-golden-age" },
          { label: "Trap Music Hub", href: "/atlanta/genres/trap" },
          { label: "Best ATL Albums of the 2010s", href: "/atlanta/best-of/best-atl-albums-2010s" },
          { label: "20 Atlanta Producers You Should Know", href: "/atlanta/best-of/atlanta-producers-to-know" },
        ],
      },
    ],
  },
  {
    slug: "mike-will-made-it",
    title: "Mike WiLL Made-It",
    description: "Mike WiLL Made-It — Atlanta producer/hitmaker behind earworm trap-pop and EarDrummers energy.",
    kind: "producer",
    keywords: ["mike will made-it", "eardrummers", "atlanta producer"],
    intro: "Mike WiLL made Atlanta trap talk to pop radio without losing bounce — tags, melodies, and rollout instinct.",
    bio: "A defining 2010s Atlanta producer brand: collaborations across rap and pop, a label/collective footprint (EarDrummers), and a gift for sticky drums.",
    neighborhood: "Atlanta",
    notable: ["EarDrummers collective/label energy", "Trap-pop crossover instincts", "2010s hit density"],
    crossLinks: [
      {
        heading: "Related",
        links: [
          { label: "Trap-Soul Hub", href: "/atlanta/genres/trap-soul" },
          { label: "Atlanta Hip-Hop in the 2010s", href: "/atlanta/eras/atlanta-hip-hop-2010s" },
          { label: "20 Atlanta Producers You Should Know", href: "/atlanta/best-of/atlanta-producers-to-know" },
        ],
      },
    ],
  },
]
