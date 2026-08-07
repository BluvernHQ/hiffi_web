import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import HiffiAboutHome from "./components/hiffi-about/hiffi-about-home";

export const metadata: Metadata = {
  title: "About Hiffi | Artist-First Music Platform",
  description:
    "Hiffi is an artist-first hip-hop platform where rappers, producers, DJs, and fans connect. Discover rap music videos, new artists, freestyles, and culture.",
  keywords: [
    "Hiffi platform",
    "about Hiffi",
    "artist-first music platform",
    "hip-hop platform for independent artists",
    "rap music video platform",
    "music platform for rappers",
    "independent hip-hop platform",
    "discover hip-hop artists",
    "Hiffi artists and fans",
  ],
  alternates: {
    canonical: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return <HiffiAboutHome />;
}
