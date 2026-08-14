import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import ForFansHome from "./for-fans-home";

export const metadata: Metadata = {
  title: "For Fans | Hiffi",
  description:
    "Enhance your fandom on Hiffi. Discover artists, engage with content, connect authentically, and support your favorites.",
  alternates: {
    canonical: absoluteUrl("/for-fans"),
  },
};

export default function Page() {
  return <ForFansHome />;
}
