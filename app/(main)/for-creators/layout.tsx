import { Poppins } from "next/font/google";
import { routeMetadata } from "@/lib/seo/route-metadata";
import AboutSiteFooter from "../about/components/hiffi-about/about-site-footer";
import "../about/hiffi-about.css";
import "../about/hiffi-promo-cards.css";
import "./for-creators.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = routeMetadata({
  title: "For Creators",
  description:
    "Build, engage, and monetize on Hiffi — tools for independent hip-hop and rap artists to publish music videos, grow a real fanbase, and earn on your terms.",
  path: "/for-creators",
  keywords: [
    "Hiffi for creators",
    "independent hip-hop artists",
    "upload rap music videos",
    "monetize music",
    "grow fanbase",
  ],
});

export default function ForCreatorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.classList.add("joyjam-rem-scale")`,
        }}
      />
      <link rel="stylesheet" href="/hiffi-about/hiffi-about.css" />
      <link rel="stylesheet" href="/hiffi-about/flip.css" />
      <div className={poppins.className}>{children}</div>
      <AboutSiteFooter />
    </>
  );
}
