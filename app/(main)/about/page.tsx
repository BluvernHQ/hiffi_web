import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import JoyJamHome from "./components/joyjam/joyjam-home";

export const metadata: Metadata = {
  title: "About Hiffi | Artist-First Music Platform",
  description:
    "Hiffi is the artist-first platform where rappers, producers, DJs, and fans connect. Discover new music, freestyles, and culture — without the algorithms.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return <JoyJamHome />;
}
