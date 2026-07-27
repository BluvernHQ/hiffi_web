import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import ForCreatorsHome from "./for-creators-home";

export const metadata: Metadata = {
  title: "For Creators | Hiffi",
  description:
    "Build, engage, and monetize on Hiffi. Tools for music creators to grow communities, publish content, and earn on your terms.",
  alternates: {
    canonical: absoluteUrl("/for-creators"),
  },
};

export default function Page() {
  return <ForCreatorsHome />;
}
