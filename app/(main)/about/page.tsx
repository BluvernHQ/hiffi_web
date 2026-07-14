import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import HiffiAboutHome from "./components/hiffi-about/hiffi-about-home";

export const metadata: Metadata = {
  title: "About Hiffi | Artist-First Music Platform",
  description:
    "Hiffi is the artist-first platform where rappers, producers, DJs, and fans connect. Discover new music, freestyles, and culture — without the algorithms.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return <HiffiAboutHome />;
}
