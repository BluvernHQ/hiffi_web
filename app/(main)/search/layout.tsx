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
    "underground hip hop artists",
    "new rappers",
    "independent artists",
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
