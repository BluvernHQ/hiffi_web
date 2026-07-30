import type { ReactNode } from "react";
import { routeMetadata } from "@/lib/seo/route-metadata";

export const metadata = routeMetadata({
  title: "Search Hip-Hop Artists & Rap Music Videos",
  description:
    "Search Hiffi for hip-hop artists, rap artists, underground artists, new rappers, music videos, drill, trap, conscious rap, and creator profiles.",
  path: "/search",
  keywords: [
    "hip hop artists",
    "rap artists",
    "underground artists",
    "underground hip hop artists",
    "new rappers",
    "best new rappers",
    "hottest new rappers",
    "top new rappers",
    "independent artists",
    "famous independent artists",
    "music artists",
    "popular rap artists",
    "popular hip hop artists",
    "90s hip hop artists",
    "90s rap artists",
    "female hip hop artists",
    "west coast hip hop artists",
    "country rap artists",
    "Christian rap artists",
    "emo rap artist",
    "cloud rap artists",
    "search hip hop artists",
    "discover rap artists",
    "artist profiles",
  ],
});

export default function SearchSegmentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
